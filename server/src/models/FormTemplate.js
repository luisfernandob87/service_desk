const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FormTemplate = sequelize.define('FormTemplate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  config: { type: DataTypes.JSONB, defaultValue: [] },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'form_templates',
  paranoid: true,
});

module.exports = FormTemplate;
