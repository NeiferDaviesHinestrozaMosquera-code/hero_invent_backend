// const express = require('express');
// const cors = require('cors');
// const sequelize = require('./config/db');
// require('dotenv').config();

// // Importar rutas
// const productRoutes = require('./routes/products');
// const categoryRoutes = require('./routes/categories');
// const supplierRoutes = require('./routes/suppliers');
// const purchaseRoutes = require('./routes/purchases');
// const saleRoutes = require('./routes/sales');
// const expenseRoutes = require('./routes/expenses');
// const incomeRoutes = require('./routes/income');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Rutas
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/suppliers', supplierRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/sales', saleRoutes);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/income', incomeRoutes);

// // Sincronizar base de datos y arrancar servidor
// const PORT = process.env.PORT || 8000;
// sequelize.sync({ alter: true })
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Servidor corriendo en http://localhost:${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error('Error al sincronizar la base de datos:', err);
//   });

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

// Importar rutas
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const purchaseRoutes = require('./routes/purchases');
const saleRoutes = require('./routes/sales');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/income');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API HeroInvent funcionando correctamente' });
});

// Sincronizar base de datos y arrancar servidor
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Sincronizar la base de datos
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

startServer();