const { Department } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.business_unit_id) where.business_unit_id = req.query.business_unit_id;
    const depts = await Department.findAll({ where, order: [['name', 'ASC']] });
    res.json(depts);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar departamentos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener departamento' });
  }
};

exports.create = async (req, res) => {
  try {
    const { business_unit_id, name, description } = req.body;
    if (!business_unit_id || !name) {
      return res.status(400).json({ error: 'business_unit_id y name requeridos' });
    }
    const dept = await Department.create({ business_unit_id, name, description });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear departamento' });
  }
};

exports.update = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
    const { name, description, is_active } = req.body;
    if (name) dept.name = name;
    if (description !== undefined) dept.description = description;
    if (is_active !== undefined) dept.is_active = is_active;
    await dept.save();
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar departamento' });
  }
};
