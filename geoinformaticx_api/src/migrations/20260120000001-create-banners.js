'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('banners', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      image_url: { type: Sequelize.STRING, allowNull: false },
      link_url: { type: Sequelize.STRING, allowNull: true },
      seller_id: { type: Sequelize.INTEGER, allowNull: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: true },
      created_by_role: { type: Sequelize.ENUM('ADMIN', 'SELLER'), allowNull: false },
      approval_status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('banners');
  },
};