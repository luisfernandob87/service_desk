const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
  },
  link: {
    type: DataTypes.STRING(500),
  },
  read_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'notifications',
  paranoid: false,
});

module.exports = Notification;
