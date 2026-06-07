const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketAttachment = sequelize.define('TicketAttachment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(100) },
  file_size: { type: DataTypes.INTEGER },
}, {
  tableName: 'ticket_attachments',
  paranoid: false,
});

module.exports = TicketAttachment;
