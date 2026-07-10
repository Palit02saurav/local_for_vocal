const sequelize = require('../config/database');
const Admin = require('./Admin');
const Seller = require('./Seller');

module.exports = { sequelize, Admin, Seller };