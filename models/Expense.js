const db = require('../config/db');

class Expense {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM expenses');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(expense) {
    const { id, date, description, amount, category, purchase_id } = expense;
    const [result] = await db.query(
      `INSERT INTO expenses 
        (id, date, description, amount, category, purchase_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
      [id, date, description, amount, category, purchase_id]
    );
    return result;
  }

  static async update(id, expense) {
    const { date, description, amount, category, purchase_id } = expense;
    const [result] = await db.query(
      `UPDATE expenses SET 
        date = ?, description = ?, amount = ?, category = ?, purchase_id = ? 
        WHERE id = ?`,
      [date, description, amount, category, purchase_id, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [id]);
    return result;
  }

  static async getByDateRange(startDate, endDate) {
    const [rows] = await db.query(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return rows;
  }

  static async getByCategory(category) {
    const [rows] = await db.query(
      'SELECT * FROM expenses WHERE category = ?',
      [category]
    );
    return rows;
  }

  static async getTotalAmountByCategory() {
    const [rows] = await db.query(
      'SELECT category, SUM(amount) as total FROM expenses GROUP BY category'
    );
    return rows;
  }
}

module.exports = Expense;