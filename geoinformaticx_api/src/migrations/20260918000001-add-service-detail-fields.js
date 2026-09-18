'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('services', 'price_type', {
      type: Sequelize.ENUM('Fixed', 'Starting From', 'Per Unit'),
      allowNull: false,
      defaultValue: 'Fixed',
    });
    await queryInterface.addColumn('services', 'price_unit', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('services', 'duration', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('services', 'coverage_areas', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('services', 'requirements', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('services', 'price_type');
    await queryInterface.removeColumn('services', 'price_unit');
    await queryInterface.removeColumn('services', 'duration');
    await queryInterface.removeColumn('services', 'coverage_areas');
    await queryInterface.removeColumn('services', 'requirements');
  },
};