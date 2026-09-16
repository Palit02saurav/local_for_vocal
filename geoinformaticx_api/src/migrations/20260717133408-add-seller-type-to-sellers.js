'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sellers', 'seller_type', {
      type: Sequelize.ENUM('product', 'service'),
      allowNull: false,
      defaultValue: 'product',
      after: 'location',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sellers', 'seller_type');
  },
};  