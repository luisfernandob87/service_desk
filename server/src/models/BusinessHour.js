const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BusinessHour = sequelize.define('BusinessHour', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  schedule: {
    type: DataTypes.JSONB,
    defaultValue: [
      { day: 1, start: '08:00', end: '17:00' },
      { day: 2, start: '08:00', end: '17:00' },
      { day: 3, start: '08:00', end: '17:00' },
      { day: 4, start: '08:00', end: '17:00' },
      { day: 5, start: '08:00', end: '17:00' },
    ],
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'America/Mexico_City',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'business_hours',
});

module.exports = BusinessHour;
