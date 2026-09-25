const sequelize = require('../config/database');
const Admin = require('./Admin');
const Seller = require('./Seller');
const Vendor = require('./Vendor');
const Product = require('./Product');
const ProductEditRequest = require('./Producteditrequest');
const Category = require('./Category');
const Service = require('./Service');
const Banner = require('./Banner');
const Customer = require('./Customer');
const CartItem = require('./CartItem');
const WishlistItem = require('./WishlistItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Notification = require('./Notification');
const Mail = require('./Mail');

Service.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller' });
Banner.belongsTo(Seller, { foreignKey: 'seller_id', as: 'seller' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
CartItem.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
CartItem.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

WishlistItem.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
WishlistItem.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
OrderItem.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

module.exports = {
  sequelize,
  Admin,
  Seller,
  Vendor,
  Product,
  Producteditrequest: ProductEditRequest,
  Category,
  Service,
  Banner,
  Customer,
  CartItem,
  WishlistItem,
  Order,
  OrderItem,
  Notification,
  Mail,
};