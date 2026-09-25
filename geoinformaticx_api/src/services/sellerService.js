const bcrypt = require('bcrypt');
const { Seller } = require('../models');

exports.listSellers = () => {
  return Seller.findAll({
    attributes: [
      'id', 'full_name', 'store_name', 'email', 'phone', 'location',
      'seller_type', 'gst_number', 'business_registration_number', 'pan_number',
      'approval_status',
    ],
    order: [['full_name', 'ASC']],
  });
};

exports.listPublicSellers = () => {
  return Seller.findAll({
    where: {
      approval_status: 'Approved',
      is_active: true,
    },
    attributes: [
      'id', 'full_name', 'store_name', 'location', 'phone',
      'latitude', 'longitude', 'seller_type',
    ],
    order: [['id', 'ASC']],
  });
};

exports.listRequests = async (userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  return Seller.findAll({
    where: { approval_status: 'Pending' },
    attributes: [
      'id', 'full_name', 'email', 'store_name', 'phone', 'location', 'created_at',
      'seller_type', 'gst_number', 'business_registration_number', 'pan_number',
    ],
    order: [['created_at', 'DESC']],
  });
};

exports.approveSeller = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const seller = await Seller.findByPk(id);
  if (!seller) {
    const err = new Error('Seller not found.');
    err.status = 404;
    throw err;
  }

  const defaultPasswordHash = await bcrypt.hash('0000', 10);
  seller.approval_status = 'Approved';
  seller.password_hash = defaultPasswordHash;
  await seller.save();

  return seller;
};

exports.rejectSeller = async (id, userRole) => {
  if (userRole !== 'SUPER_ADMIN') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const seller = await Seller.findByPk(id);
  if (!seller) {
    const err = new Error('Seller not found.');
    err.status = 404;
    throw err;
  }

  seller.approval_status = 'Rejected';
  await seller.save();

  return seller;
};

exports.getMe = async (userId, userRole) => {
  if (userRole !== 'SELLER') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const seller = await Seller.findByPk(userId, {
    attributes: [
      'id', 'full_name', 'email', 'store_name', 'phone', 'location',
      'business_address', 'seller_type', 'gst_number',
      'business_registration_number', 'pan_number', 'approval_status',
      'profile_image_url',
    ],
  });

  if (!seller) {
    const err = new Error('Seller not found.');
    err.status = 404;
    throw err;
  }

  return seller;
};

exports.changePassword = async (userId, userRole, body) => {
  if (userRole !== 'SELLER') {
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

  const seller = await Seller.findByPk(userId);
  if (!seller) {
    const err = new Error('Seller not found.');
    err.status = 404;
    throw err;
  }

  seller.password_hash = await bcrypt.hash(newPassword, 10);
  await seller.save();

  return { id: seller.id };
};

exports.updateMe = async (userId, userRole, body) => {
  if (userRole !== 'SELLER') {
    const err = new Error('Not authorized.');
    err.status = 403;
    throw err;
  }

  const seller = await Seller.findByPk(userId);
  if (!seller) {
    const err = new Error('Seller not found.');
    err.status = 404;
    throw err;
  }

  const { business_address, profile_image_url } = body;

  if (business_address !== undefined) seller.business_address = business_address;
  if (profile_image_url !== undefined) seller.profile_image_url = profile_image_url;

  await seller.save();

  return seller;
};