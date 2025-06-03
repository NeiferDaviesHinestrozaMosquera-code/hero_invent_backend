const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dbs = require('./config/db');


// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Rutas
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseItemRoutes = require('./routes/purchaseItemRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleItemRoutes = require('./routes/saleItemRoutes');
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');

// Test de conexión a la base de datos
const testDBConnection = async () => {
  try {
    const db = require('./config/db');
    const connection = await db.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    // Comment out process.exit for now to test server startup
    // process.exit(1);
  }
};


// Usar las rutas
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase_items', purchaseItemRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sale_items', saleItemRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API HeroInvent funcionando correctamente',
    version: '1.0.0',
    status: 'Server running - Controllers and routes pending creation',
    endpoints: {
      note: 'Endpoints will be available once controllers and routes are implemented',
      planned: {
        products: '/api/products',
        categories: '/api/categories',
        suppliers: '/api/suppliers',
        purchases: '/api/purchases',
        purchaseItems: '/api/purchase_items',
        sales: '/api/sales',
        saleItems: '/api/sale_items',
        expenses: '/api/expenses',
        income: '/api/income'
      }
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    requestedUrl: req.originalUrl
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

const PORT = process.env.PORT || 8000;

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testDBConnection();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Panel de administración: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('\n⚠️  NOTA: Los endpoints están pendientes de implementación');
      console.log('   📝 Crear controllers en ./controllers/');
      console.log('   📝 Crear routes en ./routes/');
      console.log('   📝 Descomentar imports en app_hero.js');
    });
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

startServer();