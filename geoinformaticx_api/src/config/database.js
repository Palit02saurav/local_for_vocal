require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,

    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : undefined,
    },

    define: {
      underscored: true,
      timestamps: true,
    },
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ MySQL (Sequelize) connected'))
  .catch(err => console.error('❌ DB connection failed:', err.message));

module.exports = sequelize;