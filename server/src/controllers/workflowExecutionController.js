const { WorkflowExecution, Workflow, Ticket, Service, SupportGroup, User, UserGroup } = require('../models');

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
    const execution = await WorkflowExecution.findByPk(req.params.id, {
      include: [
        { model: Workflow, as: 'workflow', attributes: ['id', 'name', 'nodes', 'edges'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'] },
        { model: SupportGroup, as: 'assignedGroup', attributes: ['id', 'name'] },
        { model: Ticket, as: 'tickets', attributes: ['id', 'code', 'type', 'title', 'status', 'source_node_id', 'created_at', 'assigned_group_id', 'assigned_user_id', 'resolution'] },
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
