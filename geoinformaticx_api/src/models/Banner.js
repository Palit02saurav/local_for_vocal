const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define(
  'Banner',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    image_url: { type: DataTypes.STRING, allowNull: false },
    link_url: { type: DataTypes.STRING, allowNull: true },
    seller_id: { type: DataTypes.INTEGER, allowNull: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by_role: { type: DataTypes.ENUM('ADMIN', 'SELLER'), allowNull: false },
    approval_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    payment_status: {
      type: DataTypes.ENUM('Unpaid', 'Paid'),
      allowNull: false,
      defaultValue: 'Unpaid',
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10.00,
    },
    razorpay_order_id: { type: DataTypes.STRING, allowNull: true },
    razorpay_payment_id: { type: DataTypes.STRING, allowNull: true },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'banners',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Banner;