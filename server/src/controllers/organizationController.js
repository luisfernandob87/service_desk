const { Organization } = require('../models');

exports.getBySlug = async (req, res) => {
  try {
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener organización' });
  }
};

exports.list = async (req, res) => {
  try {
    const orgs = await Organization.findAll({ order: [['name', 'ASC']] });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar organizaciones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener organización' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, slug, logo_url } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Nombre y slug requeridos' });
    }
    const org = await Organization.create({ name, slug, logo_url });
    res.status(201).json(org);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El slug ya existe' });
    }
    res.status(500).json({ error: 'Error al crear organización' });
  }
};

exports.update = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });

    const { name, slug, logo_url, is_active, landing_config, login_config } = req.body;
    if (name) org.name = name;
    if (slug) org.slug = slug;
    if (logo_url !== undefined) org.logo_url = logo_url;
    if (is_active !== undefined) org.is_active = is_active;
    if (landing_config !== undefined) org.landing_config = landing_config;
    if (login_config !== undefined) org.login_config = login_config;
    await org.save();

    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar organización' });
  }
};

exports.updateLandingConfig = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    if (req.body.landing_config !== undefined) {
      org.landing_config = req.body.landing_config;
      await org.save();
    }
    res.json({ landing_config: org.landing_config });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración de landing page' });
  }
};

exports.updateLoginConfig = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    if (req.body.login_config !== undefined) {
      org.login_config = req.body.login_config;
      await org.save();
    }
    res.json({ login_config: org.login_config });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración de login' });
  }
};

exports.remove = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organización no encontrada' });
    await org.destroy();
    res.json({ message: 'Organización eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar organización' });
  }
};
