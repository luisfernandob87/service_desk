const { User, SupportGroup, BusinessUnit, Department, Position } = require('../models');

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    if (req.query.role) where.role = req.query.role;

    const users = await User.findAll({
      where,
      include: ['organization', 'groups', 'businessUnit', 'department', 'position'],
      order: [['full_name', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    console.error('User list error:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: ['organization', 'groups', 'businessUnit', 'department', 'position'],
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.create = async (req, res) => {
  try {
    const { organization_id, full_name, email, password, role, phone, groups, business_unit_id, department_id, position_id } = req.body;
    if (!organization_id || !full_name || !email || !password) {
      return res.status(400).json({ error: 'Campos requeridos: organization_id, full_name, email, password' });
    }

    const user = await User.create({
      organization_id,
      full_name,
      email,
      password_hash: password,
      role: role || 'end_user',
      phone,
      business_unit_id,
      department_id,
      position_id,
    });

    if (groups && groups.length > 0) {
      const gs = await SupportGroup.findAll({ where: { id: groups } });
      await user.setGroups(gs);
    }

    const result = await User.findByPk(user.id, { include: ['organization', 'groups', 'businessUnit', 'department', 'position'] });
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    console.error('User create error:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { full_name, email, role, phone, is_active, organization_id, password, groups, business_unit_id, department_id, position_id } = req.body;
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined) user.is_active = is_active;
    if (organization_id) user.organization_id = organization_id;
    if (password) user.password_hash = password;
    if (business_unit_id !== undefined) user.business_unit_id = business_unit_id;
    if (department_id !== undefined) user.department_id = department_id;
    if (position_id !== undefined) user.position_id = position_id;
    await user.save();

    if (groups !== undefined) {
      const gs = await SupportGroup.findAll({ where: { id: groups } });
      await user.setGroups(gs);
    }

    const result = await User.findByPk(user.id, { include: ['organization', 'groups', 'businessUnit', 'department', 'position'] });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    await user.destroy();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
