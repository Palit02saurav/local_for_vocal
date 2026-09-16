'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'product_type', {
      type: Sequelize.ENUM('Regular', 'Regional Famous'),
      allowNull: false,
      defaultValue: 'Regular',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'product_type');
  },
};