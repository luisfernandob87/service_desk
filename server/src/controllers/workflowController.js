const { Workflow, Organization } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    const workflows = await Workflow.findAll({ where, order: [['name', 'ASC']] });
    res.json(workflows);
  } catch (error) {
    console.error('Workflow list error:', error);
    res.status(500).json({ error: 'Error al listar flujos de trabajo' });
  }
};

exports.getById = async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Flujo de trabajo no encontrado' });
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener flujo de trabajo' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, name, description, nodes, edges, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const workflow = await Workflow.create({
      organization_id: organization_id || null,
      name,
      description,
      nodes: nodes || [],
      edges: edges || [],
      is_active: is_active !== undefined ? is_active : true,
    });
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Workflow create error:', error);
    res.status(500).json({ error: 'Error al crear flujo de trabajo' });
  }
};

exports.update = async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Flujo de trabajo no encontrado' });
    const { name, description, nodes, edges, is_active } = req.body;
    if (name !== undefined) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (nodes !== undefined) workflow.nodes = nodes;
    if (edges !== undefined) workflow.edges = edges;
    if (is_active !== undefined) workflow.is_active = is_active;
    await workflow.save();
    res.json(workflow);
  } catch (error) {
    console.error('Workflow update error:', error);
    res.status(500).json({ error: 'Error al actualizar flujo de trabajo' });
  }
};

exports.remove = async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Flujo de trabajo no encontrado' });
    await workflow.destroy();
    res.json({ message: 'Flujo de trabajo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar flujo de trabajo' });
  }
};
