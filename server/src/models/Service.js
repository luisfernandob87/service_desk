const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  short_description: { type: DataTypes.STRING(300) },
  icon: { type: DataTypes.STRING(100) },
  default_assigned_group_id: { type: DataTypes.INTEGER },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
  form_config: { type: DataTypes.JSONB, defaultValue: [] },
  workflow_config: { type: DataTypes.JSONB, defaultValue: {} },
  workflow_id: { type: DataTypes.INTEGER },
  form_template_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'services',
});

module.exports = Service;
