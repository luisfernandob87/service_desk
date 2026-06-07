const { SupportGroup, User, Organization } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) {
      const groups = await SupportGroup.findAll({
        include: [
          { model: User, as: 'members', attributes: ['id', 'full_name', 'email'] },
          { model: Organization, as: 'organizations', where: { id: req.query.organization_id }, attributes: [], through: { attributes: [] } },
        ],
        order: [['name', 'ASC']],
      });
      return res.json(groups);
    }

    const groups = await SupportGroup.findAll({
      where,
      include: [
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email'] },
        { model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(groups);
  } catch (error) {
    console.error('Group list error:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const group = await SupportGroup.findByPk(req.params.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email'] },
        { model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] },
      ],
    });
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_ids, name, description } = req.body;
    if (!organization_ids || organization_ids.length === 0) {
      return res.status(400).json({ error: 'Al menos una organización es requerida' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const group = await SupportGroup.create({ name, description });

    const orgs = await Organization.findAll({ where: { id: organization_ids } });
    await group.setOrganizations(orgs);

    const result = await SupportGroup.findByPk(group.id, {
      include: [{ model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] }],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Group create error:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await SupportGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const { organization_ids, name, description, is_active, members } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (is_active !== undefined) group.is_active = is_active;
    await group.save();

    if (organization_ids !== undefined) {
      const orgs = await Organization.findAll({ where: { id: organization_ids } });
      await group.setOrganizations(orgs);
    }

    if (members !== undefined) {
      const users = await User.findAll({ where: { id: members } });
      await group.setMembers(users);
    }

    const result = await SupportGroup.findByPk(group.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email'] },
        { model: Organization, as: 'organizations', attributes: ['id', 'name', 'slug'] },
      ],
    });

    res.json(result);
  } catch (error) {
    console.error('Group update error:', error);
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
};

exports.remove = async (req, res) => {
  try {
    const group = await SupportGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
};
