const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  item_type: { type: DataTypes.ENUM('product', 'service'), allowNull: false, defaultValue: 'product' },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  service_id: { type: DataTypes.INTEGER, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'cart_items',
  underscored: true,
});

module.exports = CartItem;