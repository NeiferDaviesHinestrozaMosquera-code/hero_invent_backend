const db = require('../config/db');

class PurchaseItem {
  // Obtener todos los items de compra con información enriquecida
  static async getAll() {
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        pi.created_at,
        pi.updated_at,
        p.name as product_name,
        p.sku as product_sku,
        p.price as product_price,
        p.description as product_description,
        pu.date as purchase_date,
        pu.status as purchase_status
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN purchases pu ON pi.purchase_id = pu.id
      ORDER BY pi.created_at DESC, p.name ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Obtener item por ID con información completa
  static async getById(id) {
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        pi.created_at,
        pi.updated_at,
        p.name as product_name,
        p.sku as product_sku,
        p.price as product_price,
        p.cost as product_cost,
        p.description as product_description,
        pu.date as purchase_date,
        pu.status as purchase_status,
        pu.supplier_id,
        s.name as supplier_name
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN purchases pu ON pi.purchase_id = pu.id
      LEFT JOIN suppliers s ON pu.supplier_id = s.id
      WHERE pi.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Obtener items por compra con información del producto
  static async getBypurchase_id(purchase_id) {
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        pi.created_at,
        pi.updated_at,
        p.name as product_name,
        p.sku as product_sku,
        p.price as product_price,
        p.cost as product_cost,
        p.description as product_description
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
      ORDER BY p.name ASC
    `;
    const [rows] = await db.execute(query, [purchase_id]);
    return rows;
  }

  // ✅ CORRECCIÓN CRÍTICA: Crear sin ID - AUTO_INCREMENT maneja el ID
  static async create(itemData) {
    console.log('🔍 Model create() recibió:', itemData);
    
    // ✅ VALIDACIÓN: Asegurar que NO se envíe ID
    if (itemData.id !== undefined) {
      throw new Error('ID field is not allowed in create operation. AUTO_INCREMENT will handle it.');
    }

    // ✅ Query SIN campo ID - solo campos necesarios según estructura real de BD
    const query = `
      INSERT INTO purchase_items (purchase_id, product_id, quantity, cost)
      VALUES (?, ?, ?, ?)
    `;
    
    console.log('🚀 Ejecutando INSERT SIN ID con valores:', [
      itemData.purchase_id,
      itemData.product_id,
      itemData.quantity,
      itemData.cost
    ]);
    
    try {
      const [result] = await db.execute(query, [
        itemData.purchase_id,
        itemData.product_id,
        itemData.quantity,
        itemData.cost
      ]);
      
      console.log('✅ INSERT exitoso, ID generado:', result.insertId);
      return result;
      
    } catch (error) {
      console.error('❌ Error en INSERT:', error);
      throw error;
    }
  }

  // ✅ Actualizar item usando campos reales de la BD
  static async update(id, itemData) {
    // ✅ NO incluir subtotal - se recalcula automáticamente en la BD
    const query = `
      UPDATE purchase_items 
      SET purchase_id = ?, product_id = ?, quantity = ?, cost = ?, updated_at = CURRENT_TIMESTAMP
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
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        pi.created_at,
        pi.updated_at,
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

  // ✅ Validar que un purchase_id existe
  static async validatePurchaseExists(purchase_id) {
    const query = `SELECT id FROM purchases WHERE id = ?`;
    const [rows] = await db.execute(query, [purchase_id]);
    return rows.length > 0;
  }

  // ✅ Validar que un product_id existe
  static async validateProductExists(product_id) {
    const query = `SELECT id FROM products WHERE id = ?`;
    const [rows] = await db.execute(query, [product_id]);
    return rows.length > 0;
  }

  // ✅ Obtener estadísticas de purchase items
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(subtotal) as total_amount,
        AVG(cost) as average_cost,
        MIN(cost) as min_cost,
        MAX(cost) as max_cost
      FROM purchase_items
    `;
    const [rows] = await db.execute(query);
    return rows[0];
  }
}

module.exports = PurchaseItem;
