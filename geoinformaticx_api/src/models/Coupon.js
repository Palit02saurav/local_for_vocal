const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define(
  'Coupon',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    discount_type: { type: DataTypes.ENUM('PERCENT', 'FLAT'), allowNull: false, defaultValue: 'PERCENT' },
    discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    min_order_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    max_discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    usage_limit: { type: DataTypes.INTEGER, allowNull: true },
    used_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM('Active', 'Inactive'), allowNull: false, defaultValue: 'Active' },
    created_by_role: { type: DataTypes.ENUM('ADMIN', 'SELLER'), allowNull: false },
    seller_id: { type: DataTypes.INTEGER, allowNull: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'coupons',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Coupon;