const { Service, Category, Organization, SupportGroup, Workflow, FormTemplate } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.is_published === 'true') where.is_published = true;

    const services = await Service.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] },
        { model: SupportGroup, as: 'defaultGroup', attributes: ['id', 'name'] },
        { model: Workflow, as: 'workflow', attributes: ['id', 'name'] },
        { model: FormTemplate, as: 'formTemplate', attributes: ['id', 'name'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(services);
  } catch (error) {
    console.error('Service list error:', error);
    res.status(500).json({ error: 'Error al listar servicios' });
  }
};

exports.getPublished = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_published: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        {
          model: Organization, as: 'organizations',
          where: { id: req.params.orgId },
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] },
        },
        { model: FormTemplate, as: 'formTemplate' },
      ],
      order: [['name', 'ASC']],
    });

    const result = services.map(s => {
      const json = s.toJSON();
      if (json.formTemplate) {
        json.form_config = json.formTemplate.config;
      }
      return json;
    });
    res.json(result);
  } catch (error) {
    console.error('Published services error:', error);
    res.status(500).json({ error: 'Error al listar servicios publicados' });
  }
};

exports.getById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] },
        { model: Workflow, as: 'workflow', attributes: ['id', 'name'] },
        { model: FormTemplate, as: 'formTemplate' },
      ],
    });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const result = service.toJSON();
    if (result.formTemplate) {
      result.form_config = result.formTemplate.config;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_ids, category_id, name, description, short_description, icon, default_assigned_group_id, is_published, form_config, workflow_config, workflow_id, form_template_id } = req.body;
    if (!organization_ids || organization_ids.length === 0) {
      return res.status(400).json({ error: 'Al menos una organización es requerida' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const service = await Service.create({
      category_id, name, description, short_description, icon,
      default_assigned_group_id: default_assigned_group_id || null,
      is_published: is_published || false,
      form_config: form_config || [],
      workflow_config: workflow_config || {},
      workflow_id: workflow_id || null,
      form_template_id: form_template_id || null,
    });

    const orgs = await Organization.findAll({ where: { id: organization_ids } });
    await service.setOrganizations(orgs);

    const result = await Service.findByPk(service.id, {
      include: [{ model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] }],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Service create error:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const { organization_ids, category_id, name, description, short_description, icon, default_assigned_group_id, is_published, form_config, workflow_config, workflow_id, form_template_id } = req.body;
    if (name) service.name = name;
    if (category_id !== undefined) service.category_id = category_id;
    if (description !== undefined) service.description = description;
    if (short_description !== undefined) service.short_description = short_description;
    if (icon !== undefined) service.icon = icon;
    if (default_assigned_group_id !== undefined) service.default_assigned_group_id = default_assigned_group_id;
    if (is_published !== undefined) service.is_published = is_published;
    if (form_config !== undefined) service.form_config = form_config;
    if (workflow_config !== undefined) service.workflow_config = workflow_config;
    if (workflow_id !== undefined) service.workflow_id = workflow_id;
    if (form_template_id !== undefined) service.form_template_id = form_template_id;
    await service.save();

    if (organization_ids !== undefined) {
      const orgs = await Organization.findAll({ where: { id: organization_ids } });
      await service.setOrganizations(orgs);
    }

    const result = await Service.findByPk(service.id, {
      include: [{ model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] }],
    });

    res.json(result);
  } catch (error) {
    console.error('Service update error:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

exports.remove = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
    await service.destroy();
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};
