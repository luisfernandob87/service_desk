const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sla = sequelize.define('Sla', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
  },
  business_hour_id: {
    type: DataTypes.INTEGER,
  },
  response_time_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  response_time_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  resolution_time_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  resolution_time_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'slas',
  indexes: [
    { unique: true, fields: ['service_id', 'priority'] },
  ],
});

module.exports = Sla;
