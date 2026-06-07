const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowExecution = sequelize.define('WorkflowExecution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  workflow_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  service_id: {
    type: DataTypes.INTEGER,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_group_id: {
    type: DataTypes.INTEGER,
  },
  request_number: {
    type: DataTypes.STRING(20),
  },
  current_node_id: {
    type: DataTypes.STRING(100),
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'cancelled'),
    defaultValue: 'running',
  },
  context: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  started_at: {
    type: DataTypes.DATE,
  },
  completed_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'workflow_executions',
});

module.exports = WorkflowExecution;
