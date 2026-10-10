const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  payment_method: { type: DataTypes.ENUM('cod', 'upi', 'card', 'razorpay'), allowNull: false, defaultValue: 'cod' },
  payment_status: { type: DataTypes.ENUM('Unpaid', 'Paid', 'Failed'), allowNull: false, defaultValue: 'Unpaid' },
  razorpay_order_id: { type: DataTypes.STRING, allowNull: true },
  razorpay_payment_id: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  coupon_code: { type: DataTypes.STRING(30), allowNull: true },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'orders',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Order;