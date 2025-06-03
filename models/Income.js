const db = require('../config/db');

class Income {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM income');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM income WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(income) {
    const { id, date, description, amount, category, sale_id } = income;
    const [result] = await db.query(
      `INSERT INTO income 
        (id, date, description, amount, category, sale_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
      [id, date, description, amount, category, sale_id]
    );
    return result;
  }

  static async update(id, income) {
    const { date, description, amount, category, sale_id } = income;
    const [result] = await db.query(
      `UPDATE income SET 
        date = ?, description = ?, amount = ?, category = ?, sale_id = ? 
        WHERE id = ?`,
      [date, description, amount, category, sale_id, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM income WHERE id = ?', [id]);
    return result;
  }

  static async getByDateRange(startDate, endDate) {
    const [rows] = await db.query(
      'SELECT * FROM income WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return rows;
  }

  static async getByCategory(category) {
    const [rows] = await db.query(
      'SELECT * FROM income WHERE category = ?',
      [category]
    );
    return rows;
  }

  static async getTotalAmountByCategory() {
    const [rows] = await db.query(
      'SELECT category, SUM(amount) as total FROM income GROUP BY category'
    );
    return rows;
  }

  static async getSalesIncome() {
    const [rows] = await db.query(
      `SELECT i.*, s.total as sale_total 
       FROM income i
       JOIN sales s ON i.sale_id = s.id
       WHERE i.category = 'Ventas'`
    );
    return rows;
  }
}

module.exports = Income;