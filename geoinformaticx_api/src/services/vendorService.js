const bcrypt = require('bcrypt');
const { Vendor } = require('../models');

exports.listVendors = () => {
  return Vendor.findAll({
    attributes: [
      'id', 'full_name', 'phone', 'address', 'id_type', 'id_number', 'approval_status',
    ],
    order: [['full_name', 'ASC']],
  });
};

exports.listRequests = async (userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  return Vendor.findAll({
    where: { approval_status: 'Pending' },
    attributes: [
      'id', 'full_name', 'phone', 'address', 'id_type', 'id_number', 'created_at',
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.approveVendor = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const vendor = await Vendor.findByPk(id);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.status = 404;
    throw err;
  }

  const defaultPasswordHash = await bcrypt.hash('0000', 10);
  vendor.approval_status = 'Approved';
  vendor.password_hash = defaultPasswordHash;
  await vendor.save();

  return vendor;
};

exports.rejectVendor = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const vendor = await Vendor.findByPk(id);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.status = 404;
    throw err;
  }

  vendor.approval_status = 'Rejected';
  await vendor.save();

  return vendor;
};

exports.getMe = async (userId, userRole) => {
  if (userRole !== 'VENDOR') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const vendor = await Vendor.findByPk(userId, {
    attributes: [
      'id', 'full_name', 'phone', 'address', 'id_type', 'id_number', 'approval_status',
    ],
  });

  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.status = 404;
    throw err;
  }

  return vendor;
};

exports.changePassword = async (userId, userRole, body) => {
  if (userRole !== 'VENDOR') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const { newPassword } = body;

  if (!newPassword || newPassword.length < 4) {
    const err = new Error('New password must be at least 4 characters.');
    err.status = 400;
    throw err;
  }

  const vendor = await Vendor.findByPk(userId);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.status = 404;
    throw err;
  }

  vendor.password_hash = await bcrypt.hash(newPassword, 10);
  await vendor.save();

  return { id: vendor.id };
};