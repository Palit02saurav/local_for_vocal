const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const Seller = require('./Seller');

const ProductEditRequest = sequelize.define(
  'ProductEditRequest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    seller_id: { type: DataTypes.INTEGER, allowNull: false },
    changes: { type: DataTypes.JSON, allowNull: false },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  {
    tableName: 'product_edit_requests',
    underscored: true,
    timestamps: true,
  }
);

ProductEditRequest.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductEditRequest.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller' });

module.exports = ProductEditRequest;