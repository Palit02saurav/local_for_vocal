'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    });
  },
};