const db = require('../config/db');

class Sale {
  
  static async getAll() {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      ORDER BY s.date DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      WHERE s.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(sale) {
    // Generar valores por defecto si no se proporcionan
    const date = sale.date || new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const created_at = new Date();
    const updated_at = created_at;
    
    const { customer, customer_id, total, status, payment } = sale;

    // Validar que se proporcione customer o customer_id
    if (!customer && !customer_id) {
      throw new Error('Customer name or customer_id is required');
    }

    const [result] = await db.query(
      `INSERT INTO sales (date, customer_id, total, status, payment, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        date, 
       
        customer_id || null, 
        total || 0, 
        status || 'pending', 
        payment || 'cash', 
        created_at, 
        updated_at
      ]
    );
    return result;
  }

  static async update(id, sale) {
    const { date,  customer_id, total, status, payment } = sale;
    const updated_at = new Date();
    
    const [result] = await db.query(
      `UPDATE sales SET date = ?, customer_id = ?, total = ?, status = ?, payment = ?, updated_at = ? 
       WHERE id = ?`,
      [date,  customer_id, total, status, payment, updated_at, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM sales WHERE id = ?', [id]);
    return result;
  }

 static async getItemsBySaleId(sale_id) {
  const [rows] = await db.query(`
    SELECT 
      product_id, 
      quantity, 
      price
    FROM sale_items 
    WHERE sale_id = ?
  `, [sale_id]);
  return rows;
}

  static async getByCustomer(customer) {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      WHERE s.customer LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?
      ORDER BY s.date DESC
    `, [`%${customer}%`, `%${customer}%`, `%${customer}%`]);
    return rows;
  }

  static async getByCustomerId(customer_id) {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      WHERE s.customer_id = ?
      ORDER BY s.date DESC
    `, [customer_id]);
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      WHERE s.status = ? 
      ORDER BY s.date DESC
    `, [status]);
    return rows;
  }

  static async updateStatus(id, status) {
    const updated_at = new Date();
    const [result] = await db.query(
      'UPDATE sales SET status = ?, updated_at = ? WHERE id = ?',
      [status, updated_at, id]
    );
    return result;
  }

  static async getSalesByDateRange(startDate, endDate) {
    const [rows] = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email 
      FROM sales s 
      LEFT JOIN customer c ON s.customer_id = c.id 
      WHERE s.date BETWEEN ? AND ?
      ORDER BY s.date DESC
    `, [startDate, endDate]);
    return rows;
  }

  static async getTotalSales(startDate = null, endDate = null) {
    let query = 'SELECT COUNT(*) as count, SUM(total) as total_amount FROM sales WHERE status = "completed"';
    let params = [];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    const [rows] = await db.query(query, params);
    return rows[0];
  }

}
// Añadir esta asociación al modelo Sale
Sale.associate = function(models) {
  Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id' });
  Sale.belongsTo(models.Customer, { foreignKey: 'customer_id' });
};

module.exports = Sale;