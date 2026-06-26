const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'resolver', 'end_user'),
    allowNull: false,
    defaultValue: 'end_user',
  },
  phone: {
    type: DataTypes.STRING(50),
  },
  business_unit_id: {
    type: DataTypes.INTEGER,
  },
  department_id: {
    type: DataTypes.INTEGER,
  },
  position_id: {
    type: DataTypes.INTEGER,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  scopes: {
    withPassword: {
      attributes: {},
    },
  },
});

User.beforeSave(async (user) => {
  if (user.changed('password_hash')) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
