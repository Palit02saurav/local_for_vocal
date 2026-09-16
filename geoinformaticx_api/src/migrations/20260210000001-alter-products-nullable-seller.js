'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'seller_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'sellers', key: 'id' },
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'seller_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'sellers', key: 'id' },
      onDelete: 'CASCADE',
    });
  },
};