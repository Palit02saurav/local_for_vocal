'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sellers', 'location', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('sellers', 'approval_status', {
      type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    });
    await queryInterface.changeColumn('sellers', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sellers', 'location');
    await queryInterface.removeColumn('sellers', 'approval_status');
    await queryInterface.changeColumn('sellers', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};