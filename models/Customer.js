const db = require('../config/db');

class Customer {
  static async getAll() {
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM customer WHERE active = 1');
      return rows;
    } finally {
      connection.release();
    }
  }

  static async getById(id) {
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM customer WHERE id = ? AND active = 1', [id]);
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async create(customerData) {
    const connection = await db.getConnection();
    try {
      const { first_name, last_name, cc, phone, email, address, city, state, postal_code } = customerData;
      const [result] = await connection.query(
        'INSERT INTO customer (first_name, last_name, cc, phone, email, address, city, state, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, cc, phone, email, address, city, state, postal_code]
      );
      return { id: result.insertId, ...customerData };
    } finally {
      connection.release();
    }
  }

  static async update(id, customerData) {
    const connection = await db.getConnection();
    try {
      const { first_name, last_name, cc, phone, email, address, city, state, postal_code } = customerData;
      await connection.query(
        'UPDATE customer SET first_name = ?, last_name = ?, cc = ?, phone = ?, email = ?, address = ?, city = ?, state = ?, postal_code = ? WHERE id = ?',
        [first_name, last_name, cc, phone, email, address, city, state, postal_code, id]
      );
      return { id, ...customerData };
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await db.getConnection();
    try {
      // Soft delete (marcar como inactivo)
      await connection.query('UPDATE customer SET active = 0 WHERE id = ?', [id]);
      return { id, message: 'Customer marked as inactive' };
    } finally {
      connection.release();
    }
  }

  static async search(searchTerm) {
    const connection = await db.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM customer 
        WHERE active = 1 AND 
          (first_name LIKE ? OR 
           last_name LIKE ? OR 
           email LIKE ? OR 
           phone LIKE ? OR 
           cc LIKE ?)`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = Customer;