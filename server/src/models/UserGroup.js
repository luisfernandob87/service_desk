const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserGroup = sequelize.define('UserGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  is_leader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'user_groups',
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'group_id'],
    },
  ],
});

module.exports = UserGroup;
