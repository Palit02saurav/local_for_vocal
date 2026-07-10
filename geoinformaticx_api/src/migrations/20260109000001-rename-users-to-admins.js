'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('users', 'admins');
  },
  down: async (queryInterface) => {
    await queryInterface.renameTable('admins', 'users');
  },
};