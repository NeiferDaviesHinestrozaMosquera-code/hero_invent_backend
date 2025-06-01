const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'categories'
});

// Relación con Productos (una categoría tiene muchos productos)
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

module.exports = Category;