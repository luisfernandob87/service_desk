const { Position } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    const positions = await Position.findAll({
      where,
      include: ['organization'],
      order: [['name', 'ASC']],
    });
    res.json(positions);
  } catch (error) {
    console.error('Position list error:', error);
    res.status(500).json({ error: 'Error al listar puestos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id, {
      include: ['organization'],
    });
    if (!position) return res.status(404).json({ error: 'Puesto no encontrado' });
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener puesto' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, name, description } = req.body;
    if (!organization_id || !name) {
      return res.status(400).json({ error: 'Campos requeridos: organization_id, name' });
    }
    const position = await Position.create({ organization_id, name, description });
    const result = await Position.findByPk(position.id, { include: ['organization'] });
    res.status(201).json(result);
  } catch (error) {
    console.error('Position create error:', error);
    res.status(500).json({ error: 'Error al crear puesto' });
  }
};

exports.update = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position) return res.status(404).json({ error: 'Puesto no encontrado' });
    const { name, description, is_active, organization_id } = req.body;
    if (name) position.name = name;
    if (description !== undefined) position.description = description;
    if (is_active !== undefined) position.is_active = is_active;
    if (organization_id) position.organization_id = organization_id;
    await position.save();
    const result = await Position.findByPk(position.id, { include: ['organization'] });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar puesto' });
  }
};

exports.remove = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position) return res.status(404).json({ error: 'Puesto no encontrado' });
    await position.destroy();
    res.json({ message: 'Puesto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar puesto' });
  }
};
