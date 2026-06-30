const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sla = sequelize.define('Sla', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  has_priorities: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  business_hour_id: {
    type: DataTypes.INTEGER,
  },
  entries: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'slas',
});

module.exports = Sla;