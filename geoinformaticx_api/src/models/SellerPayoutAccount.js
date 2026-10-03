const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SellerPayoutAccount = sequelize.define('SellerPayoutAccount', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  seller_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  account_holder_name: { type: DataTypes.STRING(150), allowNull: false },
  bank_name: { type: DataTypes.STRING(150), allowNull: false },
  branch_name: { type: DataTypes.STRING(150), allowNull: true },
  account_number: { type: DataTypes.STRING(30), allowNull: false },
  ifsc_code: { type: DataTypes.STRING(11), allowNull: false },
  account_type: { type: DataTypes.ENUM('Savings', 'Current'), allowNull: false, defaultValue: 'Savings' },
  upi_id: { type: DataTypes.STRING(100), allowNull: true },
  status: { type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'), allowNull: false, defaultValue: 'Pending' },
}, {
  tableName: 'seller_payout_accounts',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SellerPayoutAccount;