const db = require('../config/db');

class Sale {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM sales');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM sales WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(sale) {
    const { id, date, customer, total, status } = sale;
    const [result] = await db.query(
      'INSERT INTO sales (id, date, customer, total, status) VALUES (?, ?, ?, ?, ?)',
      [id, date, customer, total, status]
    );
    return result;
  }

  static async update(id, sale) {
    const { date, customer, total, status } = sale;
    const [result] = await db.query(
      'UPDATE sales SET date = ?, customer = ?, total = ?, status = ? WHERE id = ?',
      [date, customer, total, status, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM sales WHERE id = ?', [id]);
    return result;
  }

  static async getItemsBysale_id(sale_id) {
    const [rows] = await db.query(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [sale_id]
    );
    return rows;
  }

  static async getByCustomer(customer) {
    const [rows] = await db.query(
      'SELECT * FROM sales WHERE customer = ? ORDER BY date DESC',
      [customer]
    );
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await db.query(
      'SELECT * FROM sales WHERE status = ? ORDER BY date DESC',
      [status]
    );
    return rows;
  }

  static async updateStatus(id, status) {
    const [result] = await db.query(
      'UPDATE sales SET status = ? WHERE id = ?',
      [status, id]
    );
    return result;
  }
}

module.exports = Sale;