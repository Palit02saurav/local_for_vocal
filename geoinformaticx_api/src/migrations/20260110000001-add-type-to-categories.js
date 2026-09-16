'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'type', {
      type: Sequelize.ENUM('product', 'service'),
      allowNull: false,
      defaultValue: 'product',
      after: 'image_url',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'type');
  },
};