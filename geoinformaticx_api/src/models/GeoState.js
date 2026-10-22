const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeoState = sequelize.define(
  'GeoState',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    district_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    center_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    center_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    min_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    min_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    max_lat: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    max_lng: { type: DataTypes.DECIMAL(9, 4), allowNull: false },
    geometry: { type: DataTypes.TEXT('long'), allowNull: false },
  },
  {
    tableName: 'geo_states',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = GeoState;