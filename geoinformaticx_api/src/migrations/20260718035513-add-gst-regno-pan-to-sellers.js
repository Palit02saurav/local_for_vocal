'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sellers', 'gst_number', {
      type: Sequelize.STRING(15),
      allowNull: true,
      after: 'seller_type',
    });
    await queryInterface.addColumn('sellers', 'business_registration_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'gst_number',
    });
    await queryInterface.addColumn('sellers', 'pan_number', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'business_registration_number',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sellers', 'gst_number');
    await queryInterface.removeColumn('sellers', 'business_registration_number');
    await queryInterface.removeColumn('sellers', 'pan_number');
  },
};