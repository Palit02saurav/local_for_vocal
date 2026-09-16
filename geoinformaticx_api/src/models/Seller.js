const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  store_name: {
    type: DataTypes.STRING(150),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  business_address: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Suspended'),
    defaultValue: 'Pending',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
    seller_type: {
      type: DataTypes.ENUM('product', 'service'),
      allowNull: false,
      defaultValue: 'product',
    },
    gst_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    business_registration_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pan_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    approval_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
}, {
  tableName: 'sellers',
});

module.exports = Seller;