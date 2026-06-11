const { WorkflowExecution, Workflow, Ticket, TicketComment, Service, SupportGroup, User, UserGroup, Organization } = require('../models');
const workflowEngine = require('../services/workflowEngine');

exports.listRequests = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    if (req.query.status) where.status = req.query.status;

    if (req.user.role === 'end_user') {
      where.requester_id = req.user.id;
    }

    if (req.query.my_cases === 'true' && (req.user.role === 'resolver' || req.user.role === 'manager')) {
      const memberships = await UserGroup.findAll({ where: { user_id: req.user.id } });
      const groupIds = memberships.map(m => m.group_id);
      where[require('sequelize').Op.or] = [
        { requester_id: req.user.id },
        { assigned_group_id: groupIds },
      ];
    }

    const executions = await WorkflowExecution.findAll({
      where,
      include: [
        { model: Workflow, as: 'workflow', attributes: ['id', 'name'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'source_node_id', 'created_at'] },
        { model: WorkflowExecution, as: 'parentExecution', attributes: ['id', 'request_number'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(executions);
  } catch (error) {
    console.error('Request list error:', error);
    res.status(500).json({ error: 'Error al listar peticiones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { Approval } = require('../models');
    const execution = await WorkflowExecution.findByPk(req.params.id, {
      include: [
        { model: Workflow, as: 'workflow', attributes: ['id', 'name', 'nodes', 'edges'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'source_node_id', 'created_at', 'assigned_group_id', 'assigned_user_id', 'resolution'] },
        { model: Approval, as: 'approvals', attributes: ['id', 'code', 'status', 'stage', 'source_node_id', 'rejection_reason'] },
        { model: WorkflowExecution, as: 'parentExecution', attributes: ['id', 'request_number'] },
        { model: WorkflowExecution, as: 'childExecutions', attributes: ['id', 'request_number', 'status', 'created_at'] },
        { model: Organization, as: 'organization', attributes: ['id', 'slug', 'name'] },
      ],
    });
    if (!execution) return res.status(404).json({ error: 'Petición no encontrada' });

    if (req.user.role === 'end_user' && execution.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta petición' });
    }

    res.json(execution);
  } catch (error) {
    console.error('Workflow execution get error:', error);
    res.status(500).json({ error: 'Error al obtener petición' });
  }
};

exports.listByTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.ticketId, { attributes: ['workflow_execution_id'] });
    if (!ticket?.workflow_execution_id) return res.json(null);

    const execution = await WorkflowExecution.findByPk(ticket.workflow_execution_id, {
      include: [
        { model: Workflow, as: 'workflow', attributes: ['id', 'name', 'nodes', 'edges'] },
        { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'source_node_id', 'created_at', 'assigned_group_id', 'assigned_user_id'] },
      ],
    });

    res.json(execution);
  } catch (error) {
    console.error('Workflow execution by ticket error:', error);
    res.status(500).json({ error: 'Error al obtener ejecución' });
  }
};

exports.close = async (req, res) => {
  try {
    const execution = await WorkflowExecution.findByPk(req.params.id);
    if (!execution) return res.status(404).json({ error: 'Petición no encontrada' });

    if (req.user.role === 'end_user' && execution.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta petición' });
    }

    if (execution.status !== 'completed') {
      return res.status(400).json({ error: 'Solo se puede cerrar una petición completada' });
    }

    execution.status = 'closed';
    execution.closed_at = new Date();
    await execution.save();

    res.json(execution);
  } catch (error) {
    console.error('Execution close error:', error);
    res.status(500).json({ error: 'Error al cerrar petición' });
  }
};

exports.reopen = async (req, res) => {
  try {
    const original = await WorkflowExecution.findByPk(req.params.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'default_assigned_group_id'] },
      ],
    });
    if (!original) return res.status(404).json({ error: 'Petición no encontrada' });

    if (req.user.role === 'end_user' && original.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta petición' });
    }

    if (original.status !== 'completed') {
      return res.status(400).json({ error: 'Solo se puede reabrir una petición completada' });
    }

    if (original.parent_execution_id) {
      return res.status(400).json({ error: 'Esta petición ya es una reapertura, no se puede reabrir de nuevo' });
    }

    const childCount = await WorkflowExecution.count({ where: { parent_execution_id: original.id } });
    if (childCount > 0) {
      return res.status(400).json({ error: 'Esta petición ya fue reabierta anteriormente' });
    }

    const context = original.context || {};
    const title = context.title || context.form_data?.title || `Reapertura - Petición #${original.request_number || original.id}`;
    const description = context.description || context.form_data?.description || '';

    const workflow = await Workflow.findByPk(original.workflow_id, { paranoid: false });
    if (!workflow?.nodes?.length || !workflow.is_active || workflow.deleted_at) {
      return res.status(500).json({ error: 'El flujo de trabajo original ya no está disponible' });
    }

    const workflowNodes = workflow.nodes;
    const workflowEdges = workflow.edges || [];

    const newExecution = await WorkflowExecution.create({
      workflow_id: original.workflow_id,
      service_id: original.service_id,
      organization_id: original.organization_id,
      requester_id: req.user.id,
      assigned_group_id: original.assigned_group_id || original.service?.default_assigned_group_id,
      status: 'active',
      context: { title, description, priority: context.priority || 'medium', form_data: context.form_data || {} },
      started_at: new Date(),
      parent_execution_id: original.id,
    });

    newExecution.request_number = String(newExecution.id);
    await newExecution.save();

    const firstResult = await workflowEngine.advanceToNextNode(newExecution, workflowNodes, workflowEdges);

    if (firstResult && firstResult.id && firstResult.constructor?.name === 'Ticket') {
      await TicketComment.create({
        ticket_id: firstResult.id,
        user_id: req.user.id,
        content: `Reapertura de la petición #${original.request_number || original.id}. Este caso continúa el flujo de trabajo original.`,
        is_internal: false,
        workflow_execution_id: newExecution.id,
      });
    }

    const result = await WorkflowExecution.findByPk(newExecution.id, {
      include: [
        { model: Workflow, as: 'workflow', attributes: ['id', 'name', 'nodes', 'edges'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'source_node_id', 'created_at'] },
        { model: WorkflowExecution, as: 'parentExecution', attributes: ['id', 'request_number'] },
      ],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Execution reopen error:', error);
    res.status(500).json({ error: 'Error al reabrir petición' });
  }
};
