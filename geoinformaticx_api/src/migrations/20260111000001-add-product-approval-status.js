'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'approval_status', {
      type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'approval_status');
  },
};