const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

// Importar todos los modelos primero
const Product = require('./Product');
const Category = require('./Category');
const Supplier = require('./Supplier');
const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Expense = require('./Expense');
const Income = require('./Income');

// Definir todas las asociaciones después de importar todos los modelos
// Category - Product (Uno a muchos)
Category.hasMany(Product, { 
  foreignKey: 'category_id', 
  as: 'products'
});

Product.belongsTo(Category, { 
  foreignKey: 'category_id', 
  as: 'category'
});

// Supplier - Product (Uno a muchos)
Supplier.hasMany(Product, { 
  foreignKey: 'supplier_id', 
  as: 'products'
});

Product.belongsTo(Supplier, { 
  foreignKey: 'supplier_id', 
  as: 'supplier'
});

// Purchase - PurchaseItem (Uno a muchos)
Purchase.hasMany(PurchaseItem, { 
  foreignKey: 'purchase_id', 
  as: 'items'
});

PurchaseItem.belongsTo(Purchase, { 
  foreignKey: 'purchase_id', 
  as: 'purchase'
});

// Product - PurchaseItem (Uno a muchos)
Product.hasMany(PurchaseItem, { 
  foreignKey: 'product_id', 
  as: 'purchaseItems'
});

PurchaseItem.belongsTo(Product, { 
  foreignKey: 'product_id', 
  as: 'product'
});

// Sale - SaleItem (Uno a muchos)
Sale.hasMany(SaleItem, { 
  foreignKey: 'sale_id', 
  as: 'items'
});

SaleItem.belongsTo(Sale, { 
  foreignKey: 'sale_id', 
  as: 'sale'
});

// Product - SaleItem (Uno a muchos)
Product.hasMany(SaleItem, { 
  foreignKey: 'product_id', 
  as: 'saleItems'
});

SaleItem.belongsTo(Product, { 
  foreignKey: 'product_id', 
  as: 'product'
});

// Supplier - Purchase (Uno a muchos)
Supplier.hasMany(Purchase, { 
  foreignKey: 'supplier_id', 
  as: 'purchases'
});

Purchase.belongsTo(Supplier, { 
  foreignKey: 'supplier_id', 
  as: 'supplier'
});

// Exportar todos los modelos
module.exports = {
  db,
  Product,
  Category,
  Supplier,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Expense,
  Income
};
