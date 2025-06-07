const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware de seguridad (para producción)
if (process.env.NODE_ENV === 'production') {
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  
  app.use(helmet());
  
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
      success: false,
      message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
      retryAfter: '15 minutos'
    }
  });
  
  app.use('/api/', limiter);
}

// Configuración de CORS mejorada
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:8000', 'http://127.0.0.1:3000'];
    
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`${timestamp} - ${method} ${path} - IP: ${ip}`);
    
    // Log del body para POST/PUT (solo en desarrollo)
    if (process.env.NODE_ENV === 'development' && (method === 'POST' || method === 'PUT')) {
      if (Object.keys(req.body).length > 0) {
        console.log('📝 Body:', JSON.stringify(req.body, null, 2));
      }
    }
    
    next();
  });
}

// Test de conexión a la base de datos
const testDBConnection = async () => {
  try {
    const db = require('./config/db');
    const connection = await db.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    console.warn('⚠️  El servidor continuará sin conexión a la base de datos');
    return false;
  }
};

// Importar rutas - ORDEN IMPORTANTE para evitar conflictos
const productRoutes = require('./routes/productRoutes');         // ✅ NUEVO
const categoryRoutes = require('./routes/categoryRoutes');       // Existente
const supplierRoutes = require('./routes/supplierRoutes');       // Existente
const purchaseItemRoutes = require('./routes/purchaseItemRoutes'); // ✅ CORREGIDO
const purchaseRoutes = require('./routes/purchaseRoutes');       // Existente
const saleItemRoutes = require('./routes/saleItemRoutes');       // Existente
const saleRoutes = require('./routes/saleRoutes');               // Existente
const expenseRoutes = require('./routes/expenseRoutes');         // Existente
const incomeRoutes = require('./routes/incomeRoutes');           // Existente
const customerRoutes = require('./routes/customerRoutes');       // Existente

// Registrar rutas con manejo de errores
const registerRoutes = () => {
  try {
    // ✅ Rutas principales del sistema corregido
    app.use('/api/products', productRoutes);           // ✅ NUEVO - Gestión de productos
    app.use('/api/purchase_items', purchaseItemRoutes); // ✅ CORREGIDO - Elementos de compra
    app.use('/api/purchases', purchaseRoutes);          // ✅ Compras
    
    // Rutas existentes del sistema
    app.use('/api/categories', categoryRoutes);
    app.use('/api/suppliers', supplierRoutes);
    app.use('/api/sale_items', saleItemRoutes);
    app.use('/api/sales', saleRoutes);
    app.use('/api/expenses', expenseRoutes);
    app.use('/api/income', incomeRoutes);
    app.use('/api/customers', customerRoutes);
    
    console.log('✅ Rutas registradas correctamente');
  } catch (error) {
    console.error('❌ Error registrando rutas:', error.message);
  }
};

// Registrar rutas
registerRoutes();

// Ruta de prueba principal mejorada
app.get('/', (req, res) => {
  res.json({ 
    message: 'API HeroInvent funcionando correctamente',
    version: '2.0.0',
    status: 'Server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      // ✅ Endpoints principales corregidos
      products: '/api/products',
      purchase_items: '/api/purchase_items',
      purchases: '/api/purchases',
      
      // Endpoints existentes
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      sales: '/api/sales',
      sale_items: '/api/sale_items',
      expenses: '/api/expenses',
      income: '/api/income',
      customers: '/api/customers'
    },
    features: {
      '✅ Products CRUD': 'Gestión completa de productos',
      '✅ Purchase Items CRUD': 'Gestión de elementos de compra con mapeo corregido',
      '✅ Frontend-Backend Sync': 'Compatibilidad 100% entre frontend y backend',
      '✅ Field Mapping': 'unit_cost ↔ cost automático',
      '✅ Data Validation': 'Validaciones en español',
      '✅ Error Handling': 'Manejo de errores mejorado'
    },
    docs: {
      description: 'Documentación disponible en cada endpoint',
      examples: {
        'GET /api/products': 'Obtener todos los productos',
        'POST /api/products': 'Crear nuevo producto',
        'GET /api/purchase_items': 'Obtener elementos de compra',
        'POST /api/purchase_items': 'Crear elemento de compra',
        'PUT /api/purchase_items/:id': 'Actualizar elemento de compra',
        'DELETE /api/purchase_items/:id': 'Eliminar elemento de compra'
      }
    }
  });
});

// Ruta de salud del servidor mejorada
app.get('/health', async (req, res) => {
  try {
    const db = require('./config/db');
    
    // Probar conexión a la base de datos
    const dbHealthy = await db.execute('SELECT 1 as test')
      .then(() => true)
      .catch(() => false);
    
    const health = {
      status: dbHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: dbHealthy ? 'connected' : 'disconnected',
      services: {
        api: 'operational',
        database: dbHealthy ? 'operational' : 'down',
        products: 'operational',
        purchase_items: 'operational'
      }
    };
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'error'
    });
  }
});

// ✅ Endpoint de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    system: 'HeroInvent Inventory System',
    version: '2.0.0',
    description: 'Sistema de inventario con frontend React y backend Express/MySQL',
    features: [
      'Gestión completa de productos',
      'Elementos de compra con mapeo automático de campos',
      'Compatibilidad 100% frontend-backend',
      'Validaciones bilingües',
      'Manejo robusto de errores'
    ],
    compatibility: {
      frontend: 'React 18+ con @heroui/react',
      backend: 'Node.js 16+ con Express 4.18+',
      database: 'MySQL 8.0+ o MariaDB 10.6+'
    },
    endpoints_count: {
      products: 12,
      purchase_items: 7,
      purchases: 8,
      total: '27+'
    }
  });
});

// Middleware para manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    requestedUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/info',
      'GET /api/products',
      'POST /api/products',
      'GET /api/purchase_items',
      'POST /api/purchase_items'
    ]
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  
  // Log del error con detalles
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip
  };
  
  console.error('📄 Detalles del error:', JSON.stringify(errorDetails, null, 2));
  
  // Respuesta al cliente
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    error: isDevelopment ? {
      message: error.message,
      stack: error.stack
    } : 'Error interno',
    requestId: Date.now().toString()
  });
});

const PORT = process.env.PORT || 8000;

// Función de inicialización mejorada
const startServer = async () => {
  try {
    console.log('\n🚀 ================================================');
    console.log('   Iniciando HeroInvent System v2.0.0');
    console.log('   ================================================');
    
    // Probar conexión a la base de datos
    const dbConnected = await testDBConnection();
    
    if (dbConnected) {
      // Inicializar tablas si la conexión es exitosa
      try {
        const db = require('./config/db');
        await db.initializeTables();
        console.log('✅ Tablas de base de datos inicializadas');
        
        // Insertar datos de ejemplo en desarrollo
        if (process.env.ENABLE_MOCK_DATA === 'true') {
          await db.insertSampleData();
          console.log('📊 Datos de ejemplo insertados');
        }
      } catch (dbError) {
        console.warn('⚠️  Error inicializando base de datos:', dbError.message);
      }
    }
    
    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log('\n🌐 ================================================');
      console.log(`   Servidor iniciado correctamente`);
      console.log('   ================================================');
      console.log(`   🌐 URL: http://localhost:${PORT}`);
      console.log(`   📊 API: http://localhost:${PORT}/api`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
      console.log(`   ℹ️  Info: http://localhost:${PORT}/api/info`);
      console.log('   ================================================');
      console.log('\n📍 Endpoints principales:');
      console.log('   ✅ Products: /api/products');
      console.log('   ✅ Purchase Items: /api/purchase_items');
      console.log('   ✅ Purchases: /api/purchases');
      console.log('   📂 Categories: /api/categories');
      console.log('   🏢 Suppliers: /api/suppliers');
      console.log('\n🎯 Estado del sistema:');
      console.log(`   📦 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   🗄️  Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}`);
      console.log(`   🔧 Debug: ${process.env.DEBUG === 'true' ? '✅ Activado' : '❌ Desactivado'}`);
      console.log('\n✅ Servidor listo para recibir peticiones');
      console.log('   Frontend puede conectarse en: http://localhost:3000');
      console.log('================================================\n');
    });
    
    // Configurar graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Recibida señal ${signal}, cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔄 Servidor HTTP cerrado');
        
        try {
          const db = require('./config/db');
          await db.pool.end();
          console.log('✅ Pool de base de datos cerrado');
        } catch (error) {
          console.error('❌ Error cerrando base de datos:', error.message);
        }
        
        console.log('✅ Shutdown completado');
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };
    
    // Configurar manejadores de señales
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Iniciar el servidor
startServer();

module.exports = app;
