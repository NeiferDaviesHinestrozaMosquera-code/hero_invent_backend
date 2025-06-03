const db = require('../config/db');

class PurchaseItem {
  // Obtener todos los items de compra
  static async getAll() {
    const query = `
      SELECT 
        pi.*,
        p.name as product_name,
        p.sku,
        pu.date as purchase_date
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN purchases pu ON pi.purchase_id = pu.id
      ORDER BY pu.date DESC, p.name
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Obtener item por ID
  static async getById(id) {
    const query = `
      SELECT 
        pi.*,
        p.name as product_name,
        p.sku,
        pu.date as purchase_date
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN purchases pu ON pi.purchase_id = pu.id
      WHERE pi.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Obtener items por compra
  static async getBypurchase_id(purchase_id) {
    const query = `
      SELECT 
        pi.*,
        p.name as product_name,
        p.sku,
        p.description
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
      ORDER BY p.name
    `;
    const [rows] = await db.execute(query, [purchase_id]);
    return rows;
  }

  // Crear nuevo item de compra
  static async create(itemData) {
    const query = `
      INSERT INTO purchase_items (id, purchase_id, product_id, quantity, cost)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      itemData.id,
      itemData.purchase_id,
      itemData.product_id,
      itemData.quantity,
      itemData.cost
    ]);
    return result;
  }

  // Actualizar item de compra
  static async update(id, itemData) {
    const query = `
      UPDATE purchase_items 
      SET purchase_id = ?, product_id = ?, quantity = ?, cost = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [
      itemData.purchase_id,
      itemData.product_id,
      itemData.quantity,
      itemData.cost,
      id
    ]);
    return result;
  }

  // Eliminar item de compra
  static async delete(id) {
    const query = `DELETE FROM purchase_items WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Eliminar todos los items de una compra
  static async deleteBypurchase_id(purchase_id) {
    const query = `DELETE FROM purchase_items WHERE purchase_id = ?`;
    const [result] = await db.execute(query, [purchase_id]);
    return result;
  }

  // Obtener items por producto
  static async getByproduct_id(product_id) {
    const query = `
      SELECT 
        pi.*,
        pu.date as purchase_date,
        pu.status as purchase_status,
        s.name as supplier_name
      FROM purchase_items pi
      LEFT JOIN purchases pu ON pi.purchase_id = pu.id
      LEFT JOIN suppliers s ON pu.supplier_id = s.id
      WHERE pi.product_id = ?
      ORDER BY pu.date DESC
    `;
    const [rows] = await db.execute(query, [product_id]);
    return rows;
  }
}

module.exports = PurchaseItem;