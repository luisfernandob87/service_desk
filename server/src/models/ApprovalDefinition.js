const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalDefinition = sequelize.define('ApprovalDefinition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  stages: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'approval_definitions',
});

module.exports = ApprovalDefinition;
