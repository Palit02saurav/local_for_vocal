'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      sku: { type: Sequelize.STRING, allowNull: false, unique: true },
      category: { type: Sequelize.STRING, allowNull: false },
      seller_id: { type: Sequelize.INTEGER, allowNull: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: true },
      created_by_role: {
        type: Sequelize.ENUM('ADMIN', 'SELLER'),
        allowNull: false,
      },
      approval_status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      low_stock_threshold: { type: Sequelize.INTEGER, allowNull: true },
      status: {
        type: Sequelize.ENUM('Active', 'Low Stock', 'Out of Stock', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
      },
      image_url: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('services');
  },
};