/**
 * One-off script: create (or reset) the Super Admin account.
 *
 * Usage (from the backend project root, where node_modules/.env live):
 *   node src/scripts/createSuperAdmin.js
 *
 * Safe to re-run: if the email already exists, it just updates the
 * password/role/name instead of throwing a duplicate-email error.
 */

const bcrypt = require('bcrypt');
const { sequelize, Admin } = require('../models');

const SUPER_ADMIN = {
  full_name: 'Geomaticx Super Admin',
  email: 'geomaticx@admin.com',
  password: 'Geomaticx@123456',
  role: 'SUPER_ADMIN',
};

async function run() {
  try {
    await sequelize.authenticate();

    const password_hash = await bcrypt.hash(SUPER_ADMIN.password, 10);

    const [admin, created] = await Admin.findOrCreate({
      where: { email: SUPER_ADMIN.email },
      defaults: {
        full_name: SUPER_ADMIN.full_name,
        email: SUPER_ADMIN.email,
        password_hash,
        role: SUPER_ADMIN.role,
        is_active: true,
      },
    });

    if (!created) {
      admin.full_name = SUPER_ADMIN.full_name;
      admin.password_hash = password_hash;
      admin.role = SUPER_ADMIN.role;
      admin.is_active = true;
      await admin.save();
      console.log(`✅ Super admin already existed — credentials updated for ${SUPER_ADMIN.email}`);
    } else {
      console.log(`✅ Super admin created: ${SUPER_ADMIN.email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create super admin:', err.message);
    process.exit(1);
  }
}

run();