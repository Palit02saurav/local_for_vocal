'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'created_by_role', {
      type: Sequelize.ENUM('ADMIN', 'SELLER'),
      allowNull: false,
      defaultValue: 'SELLER',
    });
    await queryInterface.addColumn('products', 'admin_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('products', 'seller_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // now nullable — admin-added products have no seller
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'created_by_role');
    await queryInterface.removeColumn('products', 'admin_id');
    await queryInterface.changeColumn('products', 'seller_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};