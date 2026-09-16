const { Mail } = require('../models');

exports.send = async ({ subject, body }, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }
  if (!subject?.trim() || !body?.trim()) {
    const err = new Error('Subject and message are required.');
    err.status = 400;
    throw err;
  }

  return Mail.create({ subject: subject.trim(), body: body.trim() });
};

exports.list = async () => {
  return Mail.findAll({ order: [['created_at', 'DESC']], limit: 50 });
};