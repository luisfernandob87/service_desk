const { Notification } = require('../models');

exports.list = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(req.query.limit || '50'),
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar notificaciones' });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, read_at: null },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.update(
      { read_at: new Date() },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    res.json({ message: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { read_at: new Date() },
      { where: { user_id: req.user.id, read_at: null } }
    );
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

exports.remove = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notif) return res.status(404).json({ error: 'Notificación no encontrada' });
    await notif.destroy();
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

exports.clearRead = async (req, res) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id, read_at: { [require('sequelize').Op.ne]: null } } });
    res.json({ message: 'Notificaciones leídas eliminadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al limpiar notificaciones' });
  }
};
