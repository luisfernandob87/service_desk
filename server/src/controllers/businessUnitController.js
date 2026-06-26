const { BusinessUnit, Department } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    const units = await BusinessUnit.findAll({
      where,
      include: [{ model: Department, as: 'departments' }],
      order: [['name', 'ASC']],
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar unidades de negocio' });
  }
};

exports.getById = async (req, res) => {
  try {
    const unit = await BusinessUnit.findByPk(req.params.id, {
      include: [{ model: Department, as: 'departments' }],
    });
    if (!unit) return res.status(404).json({ error: 'Unidad de negocio no encontrada' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener unidad de negocio' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, name, description } = req.body;
    if (!organization_id || !name) {
      return res.status(400).json({ error: 'organization_id y name requeridos' });
    }
    const unit = await BusinessUnit.create({ organization_id, name, description });
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear unidad de negocio' });
  }
};

exports.update = async (req, res) => {
  try {
    const unit = await BusinessUnit.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unidad de negocio no encontrada' });
    const { name, description, is_active } = req.body;
    if (name) unit.name = name;
    if (description !== undefined) unit.description = description;
    if (is_active !== undefined) unit.is_active = is_active;
    await unit.save();
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar unidad de negocio' });
  }
};
