const { Ticket, TicketComment, TicketAttachment, TicketRelation, Service, User, SupportGroup, Workflow, UserGroup, WorkflowExecution } = require('../models');
const slaEngine = require('../services/slaEngine');
const notificationService = require('../services/notificationService');
const workflowEngine = require('../services/workflowEngine');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.requester_id) where.requester_id = req.query.requester_id;
    if (req.query.assigned_user_id) where.assigned_user_id = req.query.assigned_user_id;

    if (req.user.role === 'end_user') {
      where.requester_id = req.user.id;
    }

    if (req.query.my_cases === 'true' && (req.user.role === 'resolver' || req.user.role === 'manager')) {
      const memberships = await UserGroup.findAll({ where: { user_id: req.user.id } });
      const groupIds = memberships.map(m => m.group_id);
      where[require('sequelize').Op.or] = [
        { assigned_user_id: req.user.id },
        { assigned_group_id: groupIds },
      ];
    }

    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(tickets);
  } catch (error) {
    console.error('Ticket list error:', error);
    res.status(500).json({ error: 'Error al listar tickets' });
  }
};

exports.getById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        {
          model: TicketAttachment, as: 'attachments',
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }],
        },
        {
          model: TicketRelation, as: 'childRelations',
          include: [{ model: Ticket, as: 'childTicket', attributes: ['id', 'title', 'type', 'status'] }],
        },
        {
          model: TicketRelation, as: 'parentRelations',
          include: [{ model: Ticket, as: 'parentTicket', attributes: ['id', 'title', 'type', 'status'] }],
        },
      ],
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    if (req.user.role === 'end_user' && ticket.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    }

    const commentWhere = ticket.workflow_execution_id
      ? { workflow_execution_id: ticket.workflow_execution_id }
      : { ticket_id: ticket.id };

    ticket.comments = await TicketComment.findAll({
      where: commentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
      order: [['created_at', 'ASC']],
    });

    res.json(ticket);
  } catch (error) {
    console.error('Ticket get error:', error);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, service_id, title, description, priority, form_data } = req.body;
    if (!organization_id || !title) {
      return res.status(400).json({ error: 'organization_id y title requeridos' });
    }

    const svc = service_id ? await Service.findByPk(service_id, {
      attributes: ['id', 'default_assigned_group_id', 'workflow_id'],
    }) : null;

    if (svc?.workflow_id) {
      const execution = await workflowEngine.startExecution(
        service_id,
        req.user.id,
        organization_id,
        { title, description, priority, form_data: form_data || {} },
      );

      if (execution) {
        const firstTicket = await Ticket.findOne({
          where: { workflow_execution_id: execution.id },
          order: [['created_at', 'ASC']],
          include: [
            { model: Service, as: 'service', attributes: ['id', 'name'] },
            { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
            { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
            { model: WorkflowExecution, as: 'execution', attributes: ['id', 'status', 'context'] },
          ],
        });

        if (firstTicket) return res.status(201).json(firstTicket);
      }
    }

    if (!req.body.type) {
      return res.status(400).json({ error: 'type requerido para servicios sin workflow' });
    }

    let assigned_group_id = svc?.default_assigned_group_id || null;

    const ticket = await Ticket.create({
      organization_id,
      service_id: service_id || null,
      requester_id: req.user.id,
      assigned_group_id,
      type: req.body.type,
      title,
      description,
      priority: priority || 'medium',
      form_data: form_data || {},
      status: 'new',
    });

    await slaEngine.applySla(ticket);

    if (ticket.assigned_group_id) {
      const group = await SupportGroup.findByPk(ticket.assigned_group_id, {
        include: [{ model: User, as: 'members', attributes: ['id'] }],
      });
      for (const member of group?.members || []) {
        await notificationService.createNotification({
          user_id: member.id,
          type: 'new_ticket',
          title: 'Nuevo ticket asignado',
          message: `Ticket "${ticket.title}" asignado a tu grupo`,
          link: `/tickets/${ticket.id}`,
        });
      }
    }

    const result = await Ticket.findByPk(ticket.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Ticket create error:', error);
    res.status(500).json({ error: 'Error al crear ticket', detail: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { status, resolution } = req.body;
    const valid = ['new', 'in_progress', 'on_hold', 'resolved', 'closed', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const previousStatus = ticket.status;
    const now = new Date();

    if (status === 'on_hold' && previousStatus !== 'on_hold') {
      ticket.sla_paused_at = now;
    }

    if (status === 'in_progress' && previousStatus === 'on_hold' && ticket.sla_paused_at) {
      const pausedMs = now.getTime() - new Date(ticket.sla_paused_at).getTime();
      const pausedMin = Math.floor(pausedMs / 60000);
      ticket.sla_paused_minutes = (ticket.sla_paused_minutes || 0) + pausedMin;
      ticket.sla_paused_at = null;
      if (ticket.sla_resolution_deadline) {
        ticket.sla_resolution_deadline = new Date(ticket.sla_resolution_deadline.getTime() + pausedMs);
      }
      if (ticket.sla_response_deadline) {
        ticket.sla_response_deadline = new Date(ticket.sla_response_deadline.getTime() + pausedMs);
      }
    }

    if (status === 'in_progress' && previousStatus === 'new' && !ticket.first_response_at) {
      ticket.first_response_at = now;
    }

    if ((status === 'resolved' || status === 'closed') && !ticket.resolved_at) {
      ticket.resolved_at = now;
    }

    if (resolution) {
      ticket.resolution = resolution;
    }

    if (previousStatus === 'resolved' && status !== 'resolved' && status !== 'closed') {
      ticket.resolved_at = null;
    }

    ticket.status = status;
    await ticket.save();

    const statusLabels = {
      resolved: 'resuelto',
      closed: 'cerrado',
      cancelled: 'cancelado',
      on_hold: 'en espera',
      in_progress: 'en progreso',
      new: 'nuevo',
    };

    await notificationService.createNotification({
      user_id: ticket.requester_id,
      type: 'ticket_status',
      title: `Ticket ${statusLabels[status] || 'actualizado'}`,
      message: `El ticket "${ticket.title}" cambió a estado: ${statusLabels[status] || status}`,
      link: `/tickets/${ticket.id}`,
    });

    if (ticket.workflow_execution_id && (status === 'resolved' || status === 'closed')) {
      await workflowEngine.advanceExecution(ticket, status);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

exports.assign = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { assigned_group_id, assigned_user_id, priority } = req.body;
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (assigned_group_id !== undefined) ticket.assigned_group_id = assigned_group_id;
    if (assigned_user_id !== undefined) {
      ticket.assigned_user_id = assigned_user_id;
      await notificationService.createNotification({
        user_id: assigned_user_id,
        type: 'ticket_assigned',
        title: 'Ticket asignado',
        message: `Te han asignado el ticket "${ticket.title}"`,
        link: `/tickets/${ticket.id}`,
      });
    }
    if (priority !== undefined && validPriorities.includes(priority)) {
      ticket.priority = priority;
      await slaEngine.recalculateSla(ticket);
    }
    await ticket.save();

    const result = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'full_name'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
      ],
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar ticket' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { content, is_internal } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });

    const comment = await TicketComment.create({
      ticket_id: parseInt(req.params.id),
      user_id: req.user.id,
      content,
      is_internal: is_internal || false,
      workflow_execution_id: ticket.workflow_execution_id || null,
    });

    const result = await TicketComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
};

exports.addAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const att = await TicketAttachment.create({
      ticket_id: parseInt(req.params.id),
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
    });

    res.status(201).json(att);
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

exports.updateFormData = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    ticket.form_data = { ...ticket.form_data, ...req.body.form_data };
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar datos del formulario' });
  }
};

exports.addRelation = async (req, res) => {
  try {
    const { child_ticket_id, relation_type } = req.body;
    if (!child_ticket_id) return res.status(400).json({ error: 'child_ticket_id requerido' });

    const relation = await TicketRelation.create({
      parent_ticket_id: parseInt(req.params.id),
      child_ticket_id,
      relation_type: relation_type || 'relates_to',
    });

    res.status(201).json(relation);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'La relación ya existe' });
    }
    res.status(500).json({ error: 'Error al crear relación' });
  }
};
