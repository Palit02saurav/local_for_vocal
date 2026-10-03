const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Seller = require('./Seller');
const Admin = require('./Admin');
const Vendor = require('./Vendor');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    sku: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    category: { type: DataTypes.STRING(100), allowNull: false },
    seller_id: { type: DataTypes.INTEGER, allowNull: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: true },
    vendor_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by_role: {
      type: DataTypes.ENUM('ADMIN', 'SELLER', 'VENDOR'),
      allowNull: false,
      defaultValue: 'SELLER',
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('Active', 'Low Stock', 'Out of Stock', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    product_type: {
      type: DataTypes.ENUM('Regular', 'Regional Famous'),
      allowNull: false,
      defaultValue: 'Regular',
    },
    delivery_type: {
      type: DataTypes.ENUM('Standard', 'Fresh'),
      allowNull: false,
      defaultValue: 'Standard',
    },
    unit: { type: DataTypes.STRING(50) },
    shelf_life: { type: DataTypes.STRING(100) },
    prep_time_minutes: { type: DataTypes.INTEGER },
    approval_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    image_url: { type: DataTypes.STRING(500) },
    gallery_urls: { type: DataTypes.TEXT }, 
    description: { type: DataTypes.TEXT },
    return_replace_accepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    return_replace_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 7 },
    brand: { type: DataTypes.STRING(100) },
    weight: { type: DataTypes.DECIMAL(8, 2) },
    dimensions: { type: DataTypes.STRING(60) },
    tags: { type: DataTypes.STRING(500) },
  },
  {
    tableName: 'products',
    underscored: true,
    timestamps: true,
  }
);

Product.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller' });
Product.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });
Product.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

module.exports = Product;