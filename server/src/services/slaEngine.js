const { Op } = require('sequelize');
const { Sla, BusinessHour, Ticket, WorkflowExecution, Workflow } = require('../models');
const notificationService = require('./notificationService');

function addBusinessHours(startDate, hoursToAdd, schedule) {
  const msPerHour = 3600000;
  let remainingMs = hoursToAdd * msPerHour;
  const current = new Date(startDate);

  while (remainingMs > 0) {
    const dayOfWeek = current.getDay();
    const dayConfig = schedule.find(s => s.day === dayOfWeek);

    if (!dayConfig) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);
    const workStart = new Date(current);
    workStart.setHours(startH, startM, 0, 0);
    const workEnd = new Date(current);
    workEnd.setHours(endH, endM, 0, 0);

    const now = current.getTime();

    if (now < workStart.getTime()) {
      current.setTime(workStart.getTime());
    }

    if (now >= workEnd.getTime()) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const availableMs = workEnd.getTime() - current.getTime();
    if (availableMs >= remainingMs) {
      current.setTime(current.getTime() + remainingMs);
      remainingMs = 0;
    } else {
      remainingMs -= availableMs;
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  }

  return current;
}

async function findSlaForTicket(ticket) {
  if (!ticket.workflow_execution_id || !ticket.source_node_id) return null;

  const execution = await WorkflowExecution.findByPk(ticket.workflow_execution_id, {
    attributes: ['workflow_id'],
    raw: true,
  });
  if (!execution) return null;

  const workflow = await Workflow.findByPk(execution.workflow_id, {
    attributes: ['nodes'],
    raw: true,
  });
  if (!workflow?.nodes?.length) return null;

  const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
  const node = nodes.find(n => n.id === ticket.source_node_id);
  if (!node?.data?.sla_id) return null;

  const sla = await Sla.findByPk(node.data.sla_id);
  if (!sla || !sla.is_active) return null;

  return sla;
}

function getEntry(sla, priority) {
  if (!sla.entries?.length) return null;
  if (!sla.has_priorities) return sla.entries[0];
  return sla.entries.find(e => e.priority === priority) || sla.entries[0];
}

async function applyDeadlines(ticket, sla, entry, startDate) {
  const responseMs = ((entry.response_h || 0) * 3600000) + ((entry.response_m || 0) * 60000);
  const resolutionMs = ((entry.resolution_h || 0) * 3600000) + ((entry.resolution_m || 0) * 60000);

  if (sla.business_hour_id) {
    const bh = await BusinessHour.findByPk(sla.business_hour_id);
    if (bh?.schedule?.length) {
      const respDeadline = addBusinessHours(startDate, responseMs / 3600000, bh.schedule);
      ticket.sla_response_deadline = respDeadline;
      ticket.sla_resolution_deadline = addBusinessHours(respDeadline, resolutionMs / 3600000, bh.schedule);
      return;
    }
  }

  ticket.sla_response_deadline = new Date(startDate.getTime() + responseMs);
  ticket.sla_resolution_deadline = new Date(ticket.sla_response_deadline.getTime() + resolutionMs);
}

exports.applySla = async (ticket) => {
  const sla = await findSlaForTicket(ticket);
  if (!sla) return;

  const entry = getEntry(sla, ticket.priority || 'medium');
  if (!entry) return;

  await applyDeadlines(ticket, sla, entry, new Date());
  await ticket.save();
};

exports.recalculateSla = async (ticket) => {
  const sla = await findSlaForTicket(ticket);
  if (!sla) {
    ticket.sla_response_deadline = null;
    ticket.sla_resolution_deadline = null;
    await ticket.save();
    return;
  }

  const entry = getEntry(sla, ticket.priority || 'medium');
  if (!entry) {
    ticket.sla_response_deadline = null;
    ticket.sla_resolution_deadline = null;
    await ticket.save();
    return;
  }

  const start = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  await applyDeadlines(ticket, sla, entry, start);
  const pausedMs = (ticket.sla_paused_minutes || 0) * 60000;
  if (pausedMs && ticket.sla_response_deadline) {
    ticket.sla_response_deadline = new Date(ticket.sla_response_deadline.getTime() + pausedMs);
    ticket.sla_resolution_deadline = new Date(ticket.sla_resolution_deadline.getTime() + pausedMs);
  }
  await ticket.save();
};

exports.checkBreaches = async () => {
  const now = new Date();
  const breached = await Ticket.findAll({
    where: {
      sla_breached: false,
      status: ['new', 'in_progress'],
      sla_resolution_deadline: { [Op.lt]: now },
    },
  });

  for (const ticket of breached) {
    let effectiveDeadline = new Date(ticket.sla_resolution_deadline);
    if (ticket.sla_paused_minutes) {
      effectiveDeadline = new Date(effectiveDeadline.getTime() + ticket.sla_paused_minutes * 60000);
    }

    if (effectiveDeadline < now) {
      ticket.sla_breached = true;
      await ticket.save();

      if (ticket.assigned_user_id) {
        await notificationService.createNotification({
          user_id: ticket.assigned_user_id,
          type: 'sla_breach',
          title: 'SLA incumplido',
          message: `El ticket "${ticket.title}" ha excedido el SLA de resolución.`,
          link: `/tickets/${ticket.id}`,
        });
      }
    }
  }
};

exports.findSlaForTicket = findSlaForTicket;
exports.getEntry = getEntry;