const { Approval, ApprovalDefinition, Ticket, User, SupportGroup, UserGroup, WorkflowExecution, Workflow } = require('../models');
const notificationService = require('../services/notificationService');
const workflowEngine = require('../services/workflowEngine');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    if (req.user.role === 'end_user') {
      where.requested_from = req.user.id;
    } else if (req.query.my_cases === 'true' || req.user.role === 'resolver') {
      const memberships = await UserGroup.findAll({ where: { user_id: req.user.id } });
      const groupIds = memberships.map(m => m.group_id);
      where[Op.or] = [
        { requested_from: req.user.id },
        { assigned_group_id: { [Op.in]: groupIds } },
      ];
    }

    const approvals = await Approval.findAll({
      where,
      include: [
        { model: Ticket, as: 'ticket', attributes: ['id', 'code', 'title', 'type', 'status', 'form_data', 'description', 'resolution'] },
        { model: User, as: 'approver', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'responder', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: WorkflowExecution, as: 'execution', attributes: ['id', 'request_number', 'context', 'status'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(approvals);
  } catch (error) {
    console.error('Approval list error:', error);
    res.status(500).json({ error: 'Error al listar aprobaciones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const approval = await Approval.findByPk(req.params.id, {
      include: [
        { model: Ticket, as: 'ticket', attributes: ['id', 'code', 'title', 'type', 'status', 'description', 'form_data', 'resolution', 'created_at'] },
        { model: User, as: 'approver', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'responder', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: WorkflowExecution, as: 'execution', include: [
          { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'resolution', 'source_node_id', 'created_at'] },
          { model: Workflow, as: 'workflow', attributes: ['id', 'name', 'nodes', 'edges'] },
          { model: Approval, as: 'approvals', attributes: ['id', 'code', 'status', 'stage', 'source_node_id'] },
        ]},
      ],
    });
    if (!approval) return res.status(404).json({ error: 'Aprobación no encontrada' });
    res.json(approval);
  } catch (error) {
    console.error('Approval get error:', error);
    res.status(500).json({ error: 'Error al obtener aprobación' });
  }
};

exports.listByTicket = async (req, res) => {
  try {
    const approvals = await Approval.findAll({
      where: { ticket_id: req.params.ticketId },
      order: [['created_at', 'ASC']],
    });
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar aprobaciones' });
  }
};

exports.createApproval = async (req, res) => {
  try {
    const { ticket_id, stage, requested_from } = req.body;
    if (!ticket_id || !stage || !requested_from) {
      return res.status(400).json({ error: 'ticket_id, stage y requested_from requeridos' });
    }

    const approval = await Approval.create({
      ticket_id,
      stage,
      requested_from,
      requested_by: req.user.id,
    });

    await notificationService.createNotification({
      user_id: requested_from,
      type: 'approval_request',
      title: 'Solicitud de aprobación',
      message: `Se requiere tu aprobación para el ticket`,
      link: `/tickets/${ticket_id}`,
    });

    res.status(201).json(approval);
  } catch (error) {
    console.error('Approval create error:', error);
    res.status(500).json({ error: 'Error al crear solicitud de aprobación' });
  }
};

exports.resolve = async (req, res) => {
  try {
    const approval = await Approval.findByPk(req.params.id, {
      include: [
        { model: WorkflowExecution, as: 'execution' },
        { model: Ticket, as: 'ticket' },
      ],
    });
    if (!approval) return res.status(404).json({ error: 'Aprobación no encontrada' });
    if (approval.status !== 'pending') return res.status(400).json({ error: 'Ya fue resuelta' });

    const { status, rejection_reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    if (status === 'rejected' && !rejection_reason?.trim()) {
      return res.status(400).json({ error: 'Debes indicar una razón de rechazo' });
    }

    approval.status = status;
    approval.comment = rejection_reason || null;
    approval.rejection_reason = status === 'rejected' ? rejection_reason : null;
    approval.responded_by = req.user.id;
    approval.resolved_at = new Date();
    await approval.save();

    if (approval.ticket_id) {
      const { TicketComment } = require('../models');
      if (status === 'rejected' && rejection_reason) {
        await TicketComment.create({
          ticket_id: approval.ticket_id,
          user_id: req.user.id,
          content: `RAZÓN DE RECHAZO: ${rejection_reason}`,
          is_internal: false,
        });
      }

      await notificationService.createNotification({
        user_id: approval.requested_by || approval.ticket?.requester_id,
        type: `approval_${status}`,
        title: status === 'approved' ? 'Aprobación concedida' : 'Aprobación rechazada',
        message: status === 'approved'
          ? 'Tu solicitud de aprobación fue aprobada.'
          : `Tu solicitud de aprobación fue rechazada. Razón: ${rejection_reason}`,
        link: `/admin/aprobaciones/${approval.id}`,
      });
    }

    if (status === 'approved' && approval.execution) {
      const execution = approval.execution;

      if (approval.ticket) {
        approval.ticket.status = 'resolved';
        approval.ticket.resolution = 'Aprobado';
        await approval.ticket.save();
      }

      const workflow = await Workflow.findByPk(execution.workflow_id, { paranoid: false });
      if (workflow?.nodes?.length && workflow.is_active && !workflow.deleted_at) {
        await workflowEngine.advanceToNextNode(execution, workflow.nodes, workflow.edges || []);
      }
    }

    if (status === 'rejected' && approval.execution) {
      const execution = approval.execution;
      execution.status = 'cancelled';
      execution.completed_at = new Date();
      await execution.save();

      await notificationService.createNotification({
        user_id: execution.requester_id,
        type: 'workflow_cancelled',
        title: 'Petición cancelada',
        message: `La petición ${execution.request_number || `#${execution.id}`} fue cancelada por rechazo en aprobación.`,
        link: `/admin/peticiones/${execution.id}`,
      });
    }

    const result = await Approval.findByPk(approval.id, {
      include: [
        { model: Ticket, as: 'ticket', attributes: ['id', 'title'] },
        { model: User, as: 'approver', attributes: ['id', 'full_name'] },
        { model: User, as: 'responder', attributes: ['id', 'full_name'] },
      ],
    });

    res.json(result);
  } catch (error) {
    console.error('Approval resolve error:', error);
    res.status(500).json({ error: 'Error al resolver aprobación' });
  }
};

exports.getDefinitions = async (req, res) => {
  try {
    const defs = await ApprovalDefinition.findAll({
      where: req.query.service_id ? { service_id: req.query.service_id } : {},
    });
    res.json(defs);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar definiciones' });
  }
};

exports.createDefinition = async (req, res) => {
  try {
    const { service_id, name, stages } = req.body;
    if (!service_id || !name) return res.status(400).json({ error: 'service_id y name requeridos' });
    const def = await ApprovalDefinition.create({ service_id, name, stages: stages || [] });
    res.status(201).json(def);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear definición' });
  }
};

exports.updateDefinition = async (req, res) => {
  try {
    const def = await ApprovalDefinition.findByPk(req.params.id);
    if (!def) return res.status(404).json({ error: 'Definición no encontrada' });
    const { name, stages, is_active } = req.body;
    if (name) def.name = name;
    if (stages) def.stages = stages;
    if (is_active !== undefined) def.is_active = is_active;
    await def.save();
    res.json(def);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar definición' });
  }
};

exports.removeDefinition = async (req, res) => {
  try {
    const def = await ApprovalDefinition.findByPk(req.params.id);
    if (!def) return res.status(404).json({ error: 'Definición no encontrada' });
    await def.destroy();
    res.json({ message: 'Definición eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar definición' });
  }
};
