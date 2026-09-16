'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('banners', 'payment_status', {
      type: Sequelize.ENUM('Unpaid', 'Paid'),
      allowNull: false,
      defaultValue: 'Unpaid',
    });
    await queryInterface.addColumn('banners', 'payment_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10.00,
    });
    await queryInterface.addColumn('banners', 'razorpay_order_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('banners', 'razorpay_payment_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('banners', 'is_published', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('banners', 'payment_status');
    await queryInterface.removeColumn('banners', 'payment_amount');
    await queryInterface.removeColumn('banners', 'razorpay_order_id');
    await queryInterface.removeColumn('banners', 'razorpay_payment_id');
    await queryInterface.removeColumn('banners', 'is_published');
  },
};