const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  order_item_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('return', 'replace', 'refund'), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('Requested', 'Initiated', 'Shipped', 'Out for Delivery', 'Delivered', 'Rejected'),
    allowNull: false,
    defaultValue: 'Requested',
  },
}, {
  tableName: 'return_requests',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ReturnRequest;