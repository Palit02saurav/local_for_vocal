const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeoDistrict = sequelize.define(
  'GeoDistrict',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    state_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    center_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    center_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    min_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    min_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    max_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    max_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    is_famous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    famous_product: { type: DataTypes.STRING, allowNull: true },
    geometry: { type: DataTypes.TEXT('long'), allowNull: false },
  },
  {
    tableName: 'geo_districts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = GeoDistrict;