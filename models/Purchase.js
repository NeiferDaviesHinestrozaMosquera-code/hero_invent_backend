const db = require('../config/db');

class Purchase {
  // Obtener todas las compras
  static async getAll() {
    const query = `
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplierId = s.id 
      ORDER BY p.date DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Obtener compra por ID
  static async getById(id) {
    const query = `
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplierId = s.id 
      WHERE p.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Obtener compras por proveedor
  static async getBySupplier(supplier_id) {
    const query = `
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplierId = s.id 
      WHERE p.supplierId = ? 
      ORDER BY p.date DESC
    `;
    const [rows] = await db.execute(query, [supplier_id]);
    return rows;
  }

  // Obtener compras por estado
  static async getByStatus(status) {
    const query = `
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplierId = s.id 
      WHERE p.status = ? 
      ORDER BY p.date DESC
    `;
    const [rows] = await db.execute(query, [status]);
    return rows;
  }

  // Obtener items de una compra - ESTA ES LA FUNCIÓN QUE CAUSABA EL ERROR
  static async getItemsBypurchase_id(purchase_id) {
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
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

  // Crear nueva compra
  static async create(purchaseData) {
    const query = `
      INSERT INTO purchases (id, date, supplierId, total, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.execute(query, [
      purchaseData.id,
      purchaseData.date,
      purchaseData.supplier_id,
      purchaseData.total,
      purchaseData.status
    ]);
    return result;
  }

  // Actualizar compra
  static async update(id, purchaseData) {
    const query = `
      UPDATE purchases 
      SET date = ?, supplierId = ?, total = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [
      purchaseData.date,
      purchaseData.supplier_id,
      purchaseData.total,
      purchaseData.status,
      id
    ]);
    return result;
  }

  // Actualizar solo el estado
  static async updateStatus(id, status) {
    const query = `UPDATE purchases SET status = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.execute(query, [status, id]);
    return result;
  }

  // Eliminar compra
  static async delete(id) {
    const query = `DELETE FROM purchases WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
  }
}

module.exports = Purchase;