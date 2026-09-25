'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'delivery_type', {
      type: Sequelize.ENUM('Standard', 'Fresh'),
      allowNull: false,
      defaultValue: 'Standard',
    });
    await queryInterface.addColumn('products', 'unit', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('products', 'shelf_life', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('products', 'prep_time_minutes', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'prep_time_minutes');
    await queryInterface.removeColumn('products', 'shelf_life');
    await queryInterface.removeColumn('products', 'unit');
    await queryInterface.removeColumn('products', 'delivery_type');
  },
};