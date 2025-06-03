const db = require('../config/db');

class SaleItem {

  static async getAll() {
    const [rows] = await db.query('SELECT * FROM sale_items');
    return rows;
  }
  ///xxxx
  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM sale_items WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(item) {
    const { id, sale_id, product_id, quantity, price ,subtotal} = item;
    const [result] = await db.query(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price,subtotal) VALUES (?, ?, ?, ?, ?,?)',
      [id, sale_id, product_id, quantity, price,subtotal]
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

  static async deleteBysale_id(sale_id) {
    const [result] = await db.query('DELETE FROM sale_items WHERE sale_id = ?', [sale_id]);
    return result;
  }
}

module.exports = SaleItem;