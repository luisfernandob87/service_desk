const { Workflow, WorkflowExecution, Ticket, Service, SupportGroup, User, Approval } = require('../models');
const notificationService = require('./notificationService');
const slaEngine = require('./slaEngine');

const NODE_TYPE_MAP = {
  incident: 'incident',
  work_order: 'work_order',
  change_request: 'change_request',
  problem: 'problem',
};

function findNodeById(nodes, nodeId) {
  return nodes.find(n => n.id === nodeId);
}

function findOutgoingEdge(edges, sourceId) {
  return edges.find(e => e.source === sourceId);
}

async function executeNode(execution, node, workflowNodes, workflowEdges) {
  const nodeType = node.data?.nodeType;
  const context = execution.context || {};

  switch (nodeType) {
    case 'incident':
    case 'work_order':
    case 'change_request':
    case 'problem': {
      const ticketType = NODE_TYPE_MAP[nodeType] || 'incident';
      const ticket = await Ticket.create({
        organization_id: execution.organization_id,
        service_id: execution.service_id,
        requester_id: execution.requester_id,
        assigned_group_id: node.data?.assigned_group_id || execution.assigned_group_id || null,
        assigned_user_id: node.data?.assigned_user_id || null,
        type: ticketType,
        title: context.title || context.form_data?.title || `Pendiente: ${node.data?.label || ticketType}`,
        description: context.description || context.form_data?.description || '',
        priority: node.data?.priority || context.priority || 'medium',
        form_data: context.form_data || context || {},
        status: 'new',
        workflow_execution_id: execution.id,
        source_node_id: node.id,
      });

      await slaEngine.applySla(ticket);

      await notificationService.createNotification({
        user_id: execution.requester_id,
        type: 'workflow_ticket_created',
        title: `Nuevo ${node.data?.label || ticketType} generado`,
        message: `Se generó un "${node.data?.label || ticketType}" como parte del flujo de trabajo`,
        link: `/tickets/${ticket.id}`,
      });

      execution.current_node_id = node.id;
      await execution.save();

      return ticket;
    }

    case 'approval': {
      const approverId = node.data?.assigned_user_id || node.data?.approver_user_id;
      const approverGroupId = node.data?.assigned_group_id;
      const approval = await Approval.create({
        stage: node.data?.label || 'Aprobación',
        status: 'pending',
        requested_from: approverId || execution.requester_id,
        requested_by: execution.requester_id,
        assigned_group_id: approverGroupId || null,
        workflow_execution_id: execution.id,
        source_node_id: node.id,
      });

      if (approverGroupId) {
        const groupMembers = await User.findAll({
          include: [{
            model: SupportGroup,
            as: 'groups',
            where: { id: approverGroupId },
            attributes: [],
          }],
          attributes: ['id'],
        });
        for (const member of groupMembers) {
          await notificationService.createNotification({
            user_id: member.id,
            type: 'approval_request',
            title: 'Solicitud de aprobación',
            message: `Se requiere tu aprobación: "${node.data?.label || 'Aprobación'}"`,
            link: `/admin/aprobaciones/${approval.id}`,
          });
        }
      }

      execution.current_node_id = node.id;
      await execution.save();

      return approval;
    }

    case 'notification': {
      const message = node.data?.message || `Notificación: ${node.data?.label || ''}`;
      const recipients = node.data?.recipients || [];

      if (recipients.length === 0) {
        const orgUsers = await User.findAll({ where: { organization_id: execution.organization_id, is_active: true } });
        for (const u of orgUsers) {
          await notificationService.createNotification({
            user_id: u.id,
            type: 'workflow_notification',
            title: node.data?.label || 'Notificación',
            message,
            link: null,
          });
        }
      } else {
        for (const userId of recipients) {
          await notificationService.createNotification({
            user_id: userId,
            type: 'workflow_notification',
            title: node.data?.label || 'Notificación',
            message,
            link: null,
          });
        }
      }

      execution.current_node_id = node.id;
      await execution.save();
      return advanceToNextNode(execution, workflowNodes, workflowEdges);
    }

    case 'condition': {
      const field = node.data?.field || 'status';
      const operator = node.data?.operator || 'equals';
      const value = node.data?.value || '';

      const formData = context.form_data || context;
      const actualValue = formData[field];
      let matches = false;

      if (operator === 'equals') matches = String(actualValue) === String(value);
      else if (operator === 'not_equals') matches = String(actualValue) !== String(value);
      else if (operator === 'contains') matches = String(actualValue || '').includes(value);
      else matches = String(actualValue) === String(value);

      execution.current_node_id = node.id;
      await execution.save();

      const edge = workflowEdges.find(e => e.source === node.id && (e.sourceHandle === (matches ? 'true' : 'false') || !e.sourceHandle));
      if (edge) return advanceToNode(execution, edge.target, workflowNodes, workflowEdges);
      return null;
    }

    case 'fin':
    case 'end': {
      execution.status = 'completed';
      execution.completed_at = new Date();
      execution.current_node_id = node.id;
      await execution.save();
      await checkAllTicketsResolved(execution);
      return null;
    }

    default:
      return null;
  }
}

async function advanceToNextNode(execution, workflowNodes, workflowEdges) {
  const currentId = execution.current_node_id;
  if (!currentId) {
    const startNode = workflowNodes.find(n => n.data?.nodeType === 'start');
    if (!startNode) return null;
    const edge = findOutgoingEdge(workflowEdges, startNode.id);
    if (!edge) return null;
    return advanceToNode(execution, edge.target, workflowNodes, workflowEdges);
  }

  const edge = findOutgoingEdge(workflowEdges, currentId);
  if (!edge) {
    execution.status = 'completed';
    execution.completed_at = new Date();
    await execution.save();
    return null;
  }

  return advanceToNode(execution, edge.target, workflowNodes, workflowEdges);
}

async function advanceToNode(execution, targetNodeId, workflowNodes, workflowEdges) {
  const targetNode = findNodeById(workflowNodes, targetNodeId);
  if (!targetNode) return null;
  return executeNode(execution, targetNode, workflowNodes, workflowEdges);
}

async function startExecution(serviceId, requesterId, organizationId, formData) {
  try {
    const service = await Service.findByPk(serviceId, {
      attributes: ['id', 'workflow_id', 'default_assigned_group_id'],
    });
    if (!service?.workflow_id) return null;

    const workflow = await Workflow.findByPk(service.workflow_id, { paranoid: false });
    if (!workflow?.nodes?.length || !workflow.is_active || workflow.deleted_at) {
      console.error('Workflow not usable:', { id: service.workflow_id, deleted: !!workflow?.deleted_at, active: workflow?.is_active, nodes: workflow?.nodes?.length });
      return null;
    }

    const workflowNodes = workflow.nodes;
    const workflowEdges = workflow.edges || [];

    const execution = await WorkflowExecution.create({
      workflow_id: service.workflow_id,
      service_id: serviceId,
      organization_id: organizationId,
      requester_id: requesterId,
      assigned_group_id: service.default_assigned_group_id,
      current_node_id: null,
      status: 'active',
      context: formData || {},
      started_at: new Date(),
    });

    execution.request_number = String(execution.id);
    await execution.save();

    await advanceToNextNode(execution, workflowNodes, workflowEdges);
    return execution;
  } catch (error) {
    console.error('WorkflowEngine startExecution error:', error);
    throw error;
  }
}

async function advanceExecution(ticket, newStatus) {
  if (!ticket.workflow_execution_id) return null;
  if (newStatus !== 'resolved' && newStatus !== 'closed') return null;

  const execution = await WorkflowExecution.findByPk(ticket.workflow_execution_id);
  if (!execution || execution.status !== 'active') return null;

  const workflow = await Workflow.findByPk(execution.workflow_id, { paranoid: false });
  if (!workflow?.nodes?.length || !workflow.is_active || workflow.deleted_at) return null;

  const workflowNodes = workflow.nodes;
  const workflowEdges = workflow.edges || [];

  if (ticket.resolution) {
    execution.context = {
      ...execution.context,
      previous_resolution: ticket.resolution,
      previous_ticket: { id: ticket.id, type: ticket.type, title: ticket.title, status: ticket.status },
    };
    await execution.save();
  }

  const currentNode = workflowNodes.find(n => n.id === ticket.source_node_id) ||
    workflowNodes.find(n => n.id === execution.current_node_id);
  if (!currentNode) return null;

  if (currentNode.data?.nodeType === 'approval') {
    return null;
  }

  return advanceToNextNode(execution, workflowNodes, workflowEdges);
}

async function syncExecutionStatus(executionId) {
  const execution = await WorkflowExecution.findByPk(executionId);
  if (!execution || ['completed', 'closed', 'cancelled'].includes(execution.status)) return;

  const tickets = await Ticket.findAll({ where: { workflow_execution_id: executionId } });

  if (tickets.some(t => t.status === 'on_hold')) {
    execution.status = 'on_hold';
  } else {
    execution.status = 'active';
  }
  await execution.save();
}

async function checkAllTicketsResolved(execution) {
  const tickets = await Ticket.findAll({ where: { workflow_execution_id: execution.id } });
  const allResolved = tickets.every(t => ['resolved', 'closed'].includes(t.status));
  if (allResolved || tickets.length === 0) {
    execution.status = 'completed';
    execution.completed_at = new Date();
    await execution.save();
  }
}

module.exports = { startExecution, advanceExecution, advanceToNextNode, syncExecutionStatus };
