const { Op } = require('sequelize');
const { Sla, BusinessHour, Ticket } = require('../models');
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

async function findSla(serviceId, priority) {
  const sla = await Sla.findOne({ where: { service_id: serviceId, priority }, paranoid: false });
  if (sla && sla.is_active) return sla;
  return null;
}

async function applyDeadlines(ticket, sla, startDate) {
  const responseMs = (sla.response_time_hours * 3600000) + (sla.response_time_minutes * 60000);
  const resolutionMs = (sla.resolution_time_hours * 3600000) + (sla.resolution_time_minutes * 60000);

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
  if (!ticket.service_id) return;
  const sla = await findSla(ticket.service_id, ticket.priority || 'medium');
  if (!sla) return;
  await applyDeadlines(ticket, sla, new Date());
  await ticket.save();
};

exports.recalculateSla = async (ticket) => {
  if (!ticket.service_id) return;
  const sla = await findSla(ticket.service_id, ticket.priority || 'medium');
  if (!sla) {
    ticket.sla_response_deadline = null;
    ticket.sla_resolution_deadline = null;
    await ticket.save();
    return;
  }
  const start = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  await applyDeadlines(ticket, sla, start);
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
