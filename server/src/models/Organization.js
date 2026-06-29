const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  logo_url: {
    type: DataTypes.STRING(500),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  landing_config: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  login_config: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'organizations',
});

module.exports = Organization;
