const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketRelation = sequelize.define('TicketRelation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  child_ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  relation_type: {
    type: DataTypes.ENUM('relates_to', 'caused_by', 'duplicates', 'blocks'),
    defaultValue: 'relates_to',
  },
}, {
  tableName: 'ticket_relations',
  paranoid: false,
  indexes: [
    { unique: true, fields: ['parent_ticket_id', 'child_ticket_id'] },
  ],
});

module.exports = TicketRelation;
