const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportGroupOrganization = sequelize.define('SupportGroupOrganization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  support_group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'support_group_organizations',
  paranoid: false,
  indexes: [
    { unique: true, fields: ['support_group_id', 'organization_id'] },
  ],
});

module.exports = SupportGroupOrganization;
