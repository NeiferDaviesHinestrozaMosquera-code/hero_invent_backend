const db = require('../config/db');

class Product {
  // Obtener todos los productos
  static async getAll() {
    const query = `
      SELECT p.*, 
             c.name AS category_name,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Obtener producto por ID
  static async getById(id) {
    const query = `
      SELECT p.*, 
             c.name AS category_name,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  // Crear nuevo producto
  static async create(productData) {
    const query = `
      INSERT INTO products (
        id, name, description, price, cost, stock, min_stock, 
        category_id, supplier_id, sku, barcode, is_active, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      productData.id,
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
      productData.is_active,
      productData.image
    ]);
    return result;
  }

  // Actualizar producto
  static async update(id, productData) {
    const query = `
      UPDATE products SET
        name = ?,
        description = ?,
        price = ?,
        cost = ?,
        stock = ?,
        min_stock = ?,
        category_id = ?,
        supplier_id = ?,
        sku = ?,
        barcode = ?,
        is_active = ?,
        image = ?
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
      productData.is_active,
      productData.image,
      id
    ]);
    return result;
  }

  // Eliminar producto
  static async delete(id) {
    const query = `DELETE FROM products WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
  }

  // Obtener productos por categoría
  static async getByCategory(categoryId) {
    const query = `
      SELECT p.*, 
             c.name AS category_name,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.category_id = ?
    `;
    const [rows] = await db.execute(query, [categoryId]);
    return rows;
  }

  // Obtener productos por proveedor
  static async getBySupplier(supplier_id) {
    const query = `
      SELECT p.*, 
             c.name AS category_name,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.supplier_id = ?
    `;
    const [rows] = await db.execute(query, [supplier_id]);
    return rows;
  }

  // Buscar productos por nombre o SKU
  static async search(query) {
    const searchQuery = `
      SELECT p.*, 
             c.name AS category_name,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.name LIKE ? OR p.sku LIKE ?
    `;
    const [rows] = await db.execute(searchQuery, [`%${query}%`, `%${query}%`]);
    return rows;
  }
}

module.exports = Product;