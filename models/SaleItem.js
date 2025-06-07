const db = require('../config/db');

class SaleItem {
  static async getAll() {
    const [rows] = await db.query(`
      SELECT si.*, 
             p.name as product_name, 
             s.customer_id
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      LEFT JOIN sales s ON si.sale_id = s.id
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`
      SELECT si.*, 
             p.name as product_name, 
             s.customer_id
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      LEFT JOIN sales s ON si.sale_id = s.id 
      WHERE si.id = ?
    `, [id]);
    return rows[0];
  }

  static async getBySaleId(sale_id) {
    const [rows] = await db.query(`
      SELECT si.*, p.name as product_name, p.price as product_price 
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `, [sale_id]);
    return rows;
  }

  static async create(item) {
    const { sale_id, product_id, quantity, price } = item;
    const [result] = await db.query(
      'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [sale_id, product_id, quantity, price]
    );
    return result;
  }

  static async update(id, item) {
    const { quantity, price } = item;
    const [result] = await db.query(
      'UPDATE sale_items SET quantity = ?, price = ? WHERE id = ?',
      [quantity, price, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM sale_items WHERE id = ?', [id]);
    return result;
  }

  static async deleteBySaleId(sale_id) {
    const [result] = await db.query('DELETE FROM sale_items WHERE sale_id = ?', [sale_id]);
    return result;
  }

  static async getTotalBySaleId(sale_id) {
    const [rows] = await db.query(
      'SELECT SUM(subtotal) as total FROM sale_items WHERE sale_id = ?',
      [sale_id]
    );
    return rows[0]?.total || 0;
  }
}

module.exports = SaleItem;