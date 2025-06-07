const db = require('../config/db');

class Category {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM categories');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(category) {
    const {name, description } = category;
    const [result] = await db.query(
      'INSERT INTO categories ( name, description) VALUES ( ?, ?)',
      [name, description]
    );
    return result;
  }

  static async update(id, category) {
    const { name, description } = category;
    const [result] = await db.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return result;
  }

  static async getProductsByCategory(id) {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE category_id = ?',
      [id]
    );
    return rows;
  }
}

module.exports = Category;