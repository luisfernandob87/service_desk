const { BusinessHour } = require('../models');

exports.list = async (req, res) => {
  try {
    const hours = await BusinessHour.findAll({ order: [['name', 'ASC']] });
    res.json(hours);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar horarios' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, schedule, timezone } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const bh = await BusinessHour.create({ name, schedule: schedule || undefined, timezone });
    res.status(201).json(bh);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

exports.update = async (req, res) => {
  try {
    const bh = await BusinessHour.findByPk(req.params.id);
    if (!bh) return res.status(404).json({ error: 'Horario no encontrado' });
    const { name, schedule, timezone, is_active } = req.body;
    if (name) bh.name = name;
    if (schedule) bh.schedule = schedule;
    if (timezone) bh.timezone = timezone;
    if (is_active !== undefined) bh.is_active = is_active;
    await bh.save();
    res.json(bh);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

exports.remove = async (req, res) => {
  try {
    const bh = await BusinessHour.findByPk(req.params.id);
    if (!bh) return res.status(404).json({ error: 'Horario no encontrado' });
    await bh.destroy();
    res.json({ message: 'Horario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
};
