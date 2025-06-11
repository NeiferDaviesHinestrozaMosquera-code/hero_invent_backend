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
      : [
      'http://localhost:5173',    // Tu frontend Vite
      'http://127.0.0.1:5173',   // Alternativa localhost
      'http://localhost:3000',   // React típico
      'http://localhost:8080',   // Vue típico
      'http://localhost:8000',   // Tu backend (por si acaso)
    ];
    
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

// ✅ MIDDLEWARE DE DEPURACIÓN MEJORADO (ANTES del parsing JSON)
app.use((req, res, next) => {
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'user-agent': req.get('User-Agent')?.substring(0, 50) + '...'
    },
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  };
  
  // Log en desarrollo o si está habilitado
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REQUESTS === 'true') {
    console.log('🔍 Request:', `${req.method} ${req.path}`);
  }
  
  // Verificar peticiones GET con posible cuerpo
  if (req.method === 'GET' && req.get('Content-Length') && req.get('Content-Length') !== '0') {
    console.warn('⚠️  ADVERTENCIA: Petición GET con cuerpo detectada:', {
      path: req.path,
      contentLength: req.get('Content-Length'),
      contentType: req.get('Content-Type')
    });
  }
  
  next();
});

// ✅ MIDDLEWARE JSON MEJORADO - Manejo robusto de parsing
app.use(express.json({ 
  limit: '10mb',
  strict: false, // Permite strings simples, no solo objetos/arrays
  type: ['application/json'],
  verify: (req, res, buf, encoding) => {
    // Verificar si hay contenido vacío o solo espacios en blanco
    if (buf && buf.length === 0) {
      req.rawBody = '';
      return;
    }
    if (buf) {
      req.rawBody = buf.toString(encoding);
      // Si solo hay espacios en blanco, tratar como vacío
      if (req.rawBody.trim() === '') {
        req.rawBody = '';
      }
    }
  }
}));

// ✅ MIDDLEWARE PARA MANEJAR CUERPOS VACÍOS Y MÉTODOS SIN CUERPO
app.use((req, res, next) => {
  // Para peticiones GET, DELETE, HEAD - siempre cuerpo vacío
  if (['GET', 'DELETE', 'HEAD'].includes(req.method)) {
    req.body = {};
    return next();
  }
  
  // Para POST, PUT, PATCH - verificar contenido
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    const contentLength = req.get('Content-Length');
    
    // Si no hay content-type o contenido vacío
    if (!contentType || contentLength === '0' || !req.body) {
      req.body = {};
    }
  }
  
  next();
});

// ✅ MIDDLEWARE ESPECÍFICO PARA ERRORES DE JSON PARSING
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.warn(`⚠️  Error de JSON parsing:`, {
      method: req.method,
      path: req.path,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      errorBody: error.body,
      message: error.message.substring(0, 100)
    });
    
    return res.status(400).json({
      success: false,
      message: 'Formato JSON inválido en la petición',
      error: {
        type: 'JSON_PARSE_ERROR',
        details: 'El cuerpo de la petición no contiene JSON válido o está vacío',
        method: req.method,
        path: req.path,
        contentType: req.get('Content-Type') || 'no especificado',
        receivedBody: typeof error.body === 'string' ? error.body.substring(0, 50) : error.body
      },
      timestamp: new Date().toISOString(),
      suggestions: [
        'Verifica que el Content-Type sea application/json',
        'Asegúrate de que el JSON esté bien formateado',
        'Para peticiones GET, no envíes cuerpo en la petición',
        'Verifica que no haya caracteres invisibles en el JSON'
      ]
    });
  }
  
  next(error);
});

// Middleware para URL encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length === 0) {
      return;
    }
  }
}));

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
      if (req.body && Object.keys(req.body).length > 0) {
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
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseItemRoutes = require('./routes/purchaseItemRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleItemRoutes = require('./routes/saleItemRoutes');
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const customerRoutes = require('./routes/customerRoutes');

// Registrar rutas con manejo de errores
const registerRoutes = () => {
  try {
    // Rutas principales del sistema
    app.use('/api/products', productRoutes);
    app.use('/api/purchase_items', purchaseItemRoutes);
    app.use('/api/purchases', purchaseRoutes);
    
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
    version: '2.0.1',
    status: 'Server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      products: '/api/products',
      purchase_items: '/api/purchase_items',
      purchases: '/api/purchases',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      sales: '/api/sales',
      sale_items: '/api/sale_items',
      expenses: '/api/expenses',
      income: '/api/income',
      customers: '/api/customers'
    },
    fixes: {
      '✅ JSON Parsing': 'Manejo robusto de errores de JSON',
      '✅ Empty Body': 'Manejo de cuerpos vacíos',
      '✅ GET Requests': 'Prevención de parsing en peticiones GET',
      '✅ Debug Info': 'Información detallada de errores'
    }
  });
});

// Ruta de salud del servidor mejorada
app.get('/health', async (req, res) => {
  try {
    const db = require('./config/db');
    
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

// Endpoint de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    system: 'HeroInvent Inventory System',
    version: '2.0.1',
    description: 'Sistema de inventario con manejo robusto de errores JSON',
    fixes: [
      'Manejo mejorado de errores de parsing JSON',
      'Prevención de parsing en peticiones GET',
      'Depuración detallada de peticiones',
      'Manejo robusto de cuerpos vacíos'
    ],
    compatibility: {
      frontend: 'React 18+ con @heroui/react',
      backend: 'Node.js 16+ con Express 4.18+',
      database: 'MySQL 8.0+ o MariaDB 10.6+'
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

// ✅ MIDDLEWARE GLOBAL DE MANEJO DE ERRORES MEJORADO
app.use((error, req, res, next) => {
  // Log detallado del error
  const errorDetails = {
    message: error.message,
    name: error.name,
    status: error.status || error.statusCode,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100)
  };
  
  console.error('❌ Error no manejado:', errorDetails);
  
  // Stack trace solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('📄 Stack trace:', error.stack);
  }
  
  // Respuesta al cliente
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = error.status || error.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Error interno del servidor' : error.message,
    timestamp: new Date().toISOString(),
    error: isDevelopment ? {
      name: error.name,
      message: error.message,
      status: statusCode,
      stack: error.stack
    } : {
      type: 'SERVER_ERROR',
      code: statusCode
    },
    requestId: Date.now().toString(),
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 8000;

// Función de inicialización
const startServer = async () => {
  try {
    console.log('\n🚀 ================================================');
    console.log('   Iniciando HeroInvent System v2.0.1');
    console.log('   🔧 Con manejo mejorado de errores JSON');
    console.log('   ================================================');
    
    const dbConnected = await testDBConnection();
    
    if (dbConnected) {
      try {
        const db = require('./config/db');
        await db.initializeTables();
        console.log('✅ Tablas de base de datos inicializadas');
        
        if (process.env.ENABLE_MOCK_DATA === 'true') {
          await db.insertSampleData();
          console.log('📊 Datos de ejemplo insertados');
        }
      } catch (dbError) {
        console.warn('⚠️  Error inicializando base de datos:', dbError.message);
      }
    }
    
    const server = app.listen(PORT, () => {
      console.log('\n🌐 ================================================');
      console.log(`   ✅ Servidor iniciado - Puerto ${PORT}`);
      console.log('   ================================================');
      console.log(`   🌐 URL: http://localhost:${PORT}`);
      console.log(`   📊 API: http://localhost:${PORT}/api`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
      console.log('\n🔧 Mejoras implementadas:');
      console.log('   ✅ Manejo robusto de errores JSON');
      console.log('   ✅ Prevención de parsing en GET requests');
      console.log('   ✅ Depuración detallada de peticiones');
      console.log('   ✅ Manejo de cuerpos vacíos');
      console.log('\n🌟 El error "Unexpected end of JSON input" ha sido solucionado');
      console.log('================================================\n');
    });
    
    // Graceful shutdown
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
      
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };
    
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