const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceOrganization = sequelize.define('ServiceOrganization', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  organization_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'service_organizations',
  paranoid: false,
  indexes: [
    { unique: true, fields: ['service_id', 'organization_id'] },
  ],
});

module.exports = ServiceOrganization;
