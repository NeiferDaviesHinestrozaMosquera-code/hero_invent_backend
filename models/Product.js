const { p } = require('framer-motion/m');
const db = require('../config/db');

class Product {
  // Obtener todos los productos
  static async getAll() {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Obtener producto por ID
  static async getById(id) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Obtener productos por categoría
  static async getByCategory(category_id) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.category_id = ?
      ORDER BY p.name ASC
    `;
    const [rows] = await db.execute(query, [category_id]);
    return rows;
  }

  // Obtener productos por proveedor
  static async getBySupplier(supplier_id) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.supplier_id = ?
      ORDER BY p.name ASC
    `;
    const [rows] = await db.execute(query, [supplier_id]);
    return rows;
  }

  // Buscar productos por nombre o SKU
  static async search(searchTerm) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?
      ORDER BY p.name ASC
    `;
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await db.execute(query, [searchPattern, searchPattern, searchPattern]);
    return rows;
  }

  // Obtener productos con stock bajo
  static async getLowStock(threshold = 10) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock <= ?
      ORDER BY p.stock ASC, p.name ASC
    `;
    const [rows] = await db.execute(query, [threshold]);
    return rows;
  }

  // Crear nuevo producto
  static async create(productData) {
    const query = `
      INSERT INTO products (
        name, description, price, cost, stock, min_stock,
        category_id, supplier_id, sku, barcode, status, image, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      productData.name,
      productData.description || null,
      productData.price,
      productData.cost || null,
      productData.stock || 0,
      productData.min_stock || 0,
      productData.category_id || null,
      productData.supplier_id || null,
      productData.sku || null,
      productData.barcode || null,
      productData.status === 'active' || productData.status === true ? 1 : 0,
      productData.image || null
    ];

    console.log('SQL CREATE Query:', query);
    console.log('SQL CREATE Parameters:', params);

    const [result] = await db.execute(query, params);


    return result;
  }

  // Actualizar producto
  static async update(id, productData) {
    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, cost = ?, stock = ?, min_stock = ?,
          category_id = ?, supplier_id = ?, sku = ?, barcode = ?, status = ?, image = ?,  
          updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      productData.name,
      productData.description,
      productData.price,
      productData.cost,
      productData.stock,
      productData.min_stock,
      productData.category_id,
      productData.supplier_id,
      productData.sku,
      productData.barcode,
      productData.status === 'active' || productData.status === true ? 1 : 0,
      productData.image,
      id
    ]);

    return result;
  }

  // Actualizar solo el stock
  static async updateStock(id, stock) {
    const query = `
      UPDATE products 
      SET stock = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [stock, id]);
    return result;
  }

  // Incrementar stock (para compras)
  static async incrementStock(id, stock) {
    const query = `
      UPDATE products 
      SET stock = stock + ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [stock, id]);
    return result;
  }

  // Decrementar stock (para ventas)
  static async decrementStock(id, stock) {
    const query = `
      UPDATE products 
      SET stock = GREATEST(0, stock - ?), updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [stock, id]);
    return result;
  }

  // Actualizar precio
  static async updatePrice(id, price) {
    const query = `
      UPDATE products 
      SET price = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [price, id]);
    return result;
  }

  // Actualizar costo
  static async updateCost(id, cost) {
    const query = `
      UPDATE products 
      SET cost = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [cost, id]);
    return result;
  }

  // Cambiar estado del producto
  static async updateStatus(id, status) {
    const statusValue = status === 'active' || status === true ? 1 : 0;
    const query = `
      UPDATE products 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [statusValue, id]);
    return result;
  }

  // Eliminar producto (soft delete)
  static async softDelete(id) {
    const query = `
      UPDATE products 
      SET status = 0, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Eliminar producto permanentemente
  static async delete(id) {
    const query = `DELETE FROM products WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Verificar si el SKU ya existe
  static async skuExists(sku, excludeId = null) {
    let query = `SELECT id FROM products WHERE sku = ?`;
    let params = [sku];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Obtener estadísticas de productos
  static async getStats() {
    const query =
      `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 1 THEN 1 END) as active_products,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_products,
        AVG(price) as average_price,
        SUM(stock * cost) as total_inventory_value
      FROM products
      WHERE status != 0`;
    const [rows] = await db.execute(query);
    return rows[0];
  }
}

module.exports = Product;