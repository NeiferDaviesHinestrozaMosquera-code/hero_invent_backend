const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Supplier {
  static async create(supplierData) {
    const id = supplierData.id || uuidv4();
    const { name, contact, email, phone, address } = supplierData;
    
    const [result] = await db.execute(
      `INSERT INTO suppliers (id, name, contact, email, phone, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, contact, email, phone, address]
    );
    
    return this.findById(id);
  }

  static async findAll() {
    const [rows] = await db.execute("SELECT * FROM suppliers");
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM suppliers WHERE id = ?", [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const { name, contact, email, phone, address } = updateData;
    
    await db.execute(
      `UPDATE suppliers 
       SET name = ?, contact = ?, email = ?, phone = ?, address = ? 
       WHERE id = ?`,
      [name, contact, email, phone, address, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    await db.execute("DELETE FROM suppliers WHERE id = ?", [id]);
    return true;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM suppliers WHERE email = ?", [email]);
    return rows[0];
  }
}

module.exports = Supplier;