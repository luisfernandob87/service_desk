const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportGroup = sequelize.define('SupportGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'support_groups',
});

module.exports = SupportGroup;
