const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
  },
  stage: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
  },
  requested_from: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requested_by: {
    type: DataTypes.INTEGER,
  },
  assigned_group_id: {
    type: DataTypes.INTEGER,
  },
  comment: {
    type: DataTypes.TEXT,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
  },
  responded_by: {
    type: DataTypes.INTEGER,
  },
  resolved_at: {
    type: DataTypes.DATE,
  },
  code: {
    type: DataTypes.STRING(20),
  },
  workflow_execution_id: {
    type: DataTypes.INTEGER,
  },
  source_node_id: {
    type: DataTypes.STRING(100),
  },
}, {
  tableName: 'approvals',
  paranoid: false,
  hooks: {
    afterCreate: async (approval) => {
      approval.code = `APR-${approval.id}`;
      await approval.save();
    },
  },
});

module.exports = Approval;
