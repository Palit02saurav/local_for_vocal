const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WishlistItem = sequelize.define('WishlistItem', {
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  item_type: { type: DataTypes.ENUM('product', 'service'), allowNull: false, defaultValue: 'product' },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  service_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'wishlist_items',
  underscored: true,
});

module.exports = WishlistItem;