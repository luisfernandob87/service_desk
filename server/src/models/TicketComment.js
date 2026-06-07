const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketComment = sequelize.define('TicketComment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  is_internal: { type: DataTypes.BOOLEAN, defaultValue: false },
  workflow_execution_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'ticket_comments',
  paranoid: false,
});

module.exports = TicketComment;
