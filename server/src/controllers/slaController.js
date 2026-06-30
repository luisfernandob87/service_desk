const { Sla, BusinessHour } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    const slas = await Sla.findAll({
      where,
      include: [
        { model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(slas);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar SLA' });
  }
};

exports.getById = async (req, res) => {
  try {
    const sla = await Sla.findByPk(req.params.id, {
      include: [{ model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] }],
    });
    if (!sla) return res.status(404).json({ error: 'SLA no encontrado' });
    res.json(sla);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener SLA' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, name, description, has_priorities, business_hour_id, entries } = req.body;
    if (!organization_id || !name) {
      return res.status(400).json({ error: 'organization_id y name requeridos' });
    }
    if (!entries?.length) {
      return res.status(400).json({ error: 'Debe especificar al menos una entrada de SLA' });
    }
    const sla = await Sla.create({
      organization_id,
      name,
      description,
      has_priorities: has_priorities !== false,
      business_hour_id: business_hour_id || null,
      entries,
    });
    const result = await Sla.findByPk(sla.id, {
      include: [{ model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] }],
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('SLA create error:', error);
    res.status(500).json({ error: 'Error al crear SLA' });
  }
};

exports.update = async (req, res) => {
  try {
    const sla = await Sla.findByPk(req.params.id);
    if (!sla) return res.status(404).json({ error: 'SLA no encontrado' });

    const { name, description, has_priorities, business_hour_id, entries, is_active } = req.body;
    if (name !== undefined) sla.name = name;
    if (description !== undefined) sla.description = description;
    if (has_priorities !== undefined) sla.has_priorities = has_priorities;
    if (business_hour_id !== undefined) sla.business_hour_id = business_hour_id;
    if (entries !== undefined) sla.entries = entries;
    if (is_active !== undefined) sla.is_active = is_active;
    await sla.save();

    const result = await Sla.findByPk(sla.id, {
      include: [{ model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] }],
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar SLA' });
  }
};

exports.remove = async (req, res) => {
  try {
    const sla = await Sla.findByPk(req.params.id);
    if (!sla) return res.status(404).json({ error: 'SLA no encontrado' });
    await sla.destroy();
    res.json({ message: 'SLA eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar SLA' });
  }
};