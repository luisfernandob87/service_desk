const { FormTemplate } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.is_active === 'true') where.is_active = true;
    const templates = await FormTemplate.findAll({ where, order: [['name', 'ASC']] });
    res.json(templates);
  } catch (error) {
    console.error('FormTemplate list error:', error);
    res.status(500).json({ error: 'Error al listar plantillas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const template = await FormTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener plantilla' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, config, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const template = await FormTemplate.create({
      name,
      description,
      config: config || [],
      is_active: is_active !== undefined ? is_active : true,
    });
    res.status(201).json(template);
  } catch (error) {
    console.error('FormTemplate create error:', error);
    res.status(500).json({ error: 'Error al crear plantilla' });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await FormTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const { name, description, config, is_active } = req.body;
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (config !== undefined) template.config = config;
    if (is_active !== undefined) template.is_active = is_active;
    await template.save();

    res.json(template);
  } catch (error) {
    console.error('FormTemplate update error:', error);
    res.status(500).json({ error: 'Error al actualizar plantilla' });
  }
};

exports.remove = async (req, res) => {
  try {
    const template = await FormTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    await template.destroy();
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
};
