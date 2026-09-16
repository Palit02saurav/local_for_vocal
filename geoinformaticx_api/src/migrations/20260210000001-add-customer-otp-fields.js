'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('customers', 'is_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('customers', 'otp_code', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('customers', 'otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('customers', 'is_verified');
    await queryInterface.removeColumn('customers', 'otp_code');
    await queryInterface.removeColumn('customers', 'otp_expires_at');
  },
};