const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TYPE_PREFIX = { incident: 'INC', work_order: 'OT', change_request: 'SC', problem: 'PR' };

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER },
  requester_id: { type: DataTypes.INTEGER, allowNull: false },
  assigned_group_id: { type: DataTypes.INTEGER },
  assigned_user_id: { type: DataTypes.INTEGER },
  type: {
    type: DataTypes.ENUM('incident', 'work_order', 'change_request', 'problem'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'on_hold', 'resolved', 'closed', 'cancelled'),
    defaultValue: 'new',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  title: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT },
  code: { type: DataTypes.STRING(20) },
  form_data: { type: DataTypes.JSONB, defaultValue: {} },
  sla_response_deadline: { type: DataTypes.DATE },
  sla_resolution_deadline: { type: DataTypes.DATE },
  sla_breached: { type: DataTypes.BOOLEAN, defaultValue: false },
  sla_paused_at: { type: DataTypes.DATE },
  sla_paused_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  first_response_at: { type: DataTypes.DATE },
  resolved_at: { type: DataTypes.DATE },
  resolution: { type: DataTypes.TEXT },
  workflow_execution_id: { type: DataTypes.INTEGER },
  source_node_id: { type: DataTypes.STRING(100) },
}, {
  tableName: 'tickets',
  hooks: {
    afterCreate: async (ticket) => {
      const prefix = TYPE_PREFIX[ticket.type] || 'INC';
      ticket.code = `${prefix}-${ticket.id}`;
      await ticket.save();
    },
  },
});

module.exports = Ticket;
