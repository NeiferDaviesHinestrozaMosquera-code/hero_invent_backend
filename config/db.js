const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME || 'hero_invent_backend',
   port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar la conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
  connection.release();
});

module.exports = pool;