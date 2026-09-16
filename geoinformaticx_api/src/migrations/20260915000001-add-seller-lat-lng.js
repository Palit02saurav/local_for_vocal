module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sellers', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('sellers', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('sellers', 'latitude');
    await queryInterface.removeColumn('sellers', 'longitude');
  },
};