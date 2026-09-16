const { Customer } = require('../models');

exports.listCustomers = () => {
  return Customer.findAll({
    attributes: ['id', 'name', 'email', 'phone', 'is_active', 'created_at'],
    order: [['created_at', 'DESC']],
  });
};  