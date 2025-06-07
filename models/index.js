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
const Customer = require('./Customer');

// Importar rutas
const allRoutes = require('./routes/allRoutes');

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

// Customer - Sale (Uno a muchos)
Customer.hasMany(Sale, {
  foreignKey: 'customer_id',
  as: 'sales'
});

Sale.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// Crear la aplicación Express
const app = express();

// Configurar middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests (opcional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Usar todas las rutas con el prefijo /api
app.use('/api', allRoutes);

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      products: '/api/products',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      customers: '/api/customer',  ///XXX
      sales: '/api/sales',
      purchases: '/api/purchases',
      expenses: '/api/expenses',
      income: '/api/income'
    }
  });
});

// Middleware global para manejo de errores
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await db.execute('SELECT 1');
    console.log('✅ Database connection established');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful del servidor
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Iniciar el servidor
if (require.main === module) {
  startServer();
}

// Exportar todos los modelos y la app
module.exports = {
  app,
  db,
  Product,
  Category,
  Supplier,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Expense,
  Income,
  Customer 
};