const { Sla, Service, BusinessHour } = require('../models');

exports.list = async (req, res) => {
  try {
    const slas = await Sla.findAll({
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] },
      ],
      order: [['service_id', 'ASC'], ['priority', 'ASC']],
    });
    res.json(slas);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar SLA' });
  }
};

exports.create = async (req, res) => {
  try {
    const { service_id, priority, business_hour_id, response_time_hours, response_time_minutes, resolution_time_hours, resolution_time_minutes } = req.body;
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!service_id || !priority) {
      return res.status(400).json({ error: 'service_id y priority requeridos' });
    }
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Prioridad inválida' });
    }
    const totalResponse = (response_time_hours || 0) * 60 + (response_time_minutes || 0);
    const totalResolution = (resolution_time_hours || 0) * 60 + (resolution_time_minutes || 0);
    if (totalResponse === 0 && totalResolution === 0) {
      return res.status(400).json({ error: 'Debe especificar al menos minutos para respuesta o resolución' });
    }
    const existing = await Sla.findOne({ where: { service_id, priority } });
    if (existing) return res.status(400).json({ error: 'El servicio ya tiene un SLA para esta prioridad' });
    const sla = await Sla.create({ service_id, priority, business_hour_id: business_hour_id || null, response_time_hours: response_time_hours || 0, response_time_minutes: response_time_minutes || 0, resolution_time_hours: resolution_time_hours || 0, resolution_time_minutes: resolution_time_minutes || 0 });
    const result = await Sla.findByPk(sla.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] },
      ],
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
    const { business_hour_id, response_time_hours, response_time_minutes, resolution_time_hours, resolution_time_minutes, is_active, priority } = req.body;
    if (response_time_hours !== undefined) sla.response_time_hours = response_time_hours;
    if (response_time_minutes !== undefined) sla.response_time_minutes = response_time_minutes;
    if (resolution_time_hours !== undefined) sla.resolution_time_hours = resolution_time_hours;
    if (resolution_time_minutes !== undefined) sla.resolution_time_minutes = resolution_time_minutes;
    if (business_hour_id !== undefined) sla.business_hour_id = business_hour_id;
    if (is_active !== undefined) sla.is_active = is_active;
    if (priority) sla.priority = priority;
    await sla.save();
    const result = await Sla.findByPk(sla.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: BusinessHour, as: 'businessHour', attributes: ['id', 'name'] },
      ],
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
