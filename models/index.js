// // models/index.js
// const { Sequelize } = require('sequelize');
// const sequelize = require('../config/db');

// // Import model definitions
// const Product = require('./product.model')(sequelize, Sequelize);
// const Category = require('./category.model')(sequelize, Sequelize);
// const Supplier = require('./supplier.model')(sequelize, Sequelize);

// // Setup associations
// Product.belongsTo(Category, { foreignKey: 'categoryId' });
// Product.belongsTo(Supplier, { foreignKey: 'supplierId' });

// // Export models
// module.exports = {
//   Product,
//   Category,
//   Supplier,
//   sequelize
// };