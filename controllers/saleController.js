const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');
const db = require('../config/db');

exports.getAllSales = async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT sales.*, 
        customer.first_name, 
        customer.last_name
      FROM sales
      LEFT JOIN customer ON sales.customer_id = customer.id
    `);
    
    // Obtener items para cada venta y formatear
    const formattedSales = await Promise.all(sales.map(async sale => {
      const items = await Sale.getItemsBySaleId(sale.id);
      return {
        date: sale.date.toISOString().split('T')[0],
        customer_id: sale.customer_id,
        payment: sale.payment,
        status: sale.status,
        customer_name: sale.first_name && sale.last_name 
          ? `${sale.first_name} ${sale.last_name}` 
          : 'Cliente no registrado',
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };
    }));
    
    res.json({
      success: true,
      data: formattedSales,
      count: formattedSales.length
    });
  } catch (error) {
    console.error('Error getting all sales:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving sales',
      message: error.message 
    });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.getById(id);
    
    if (!sale) {
      return res.status(404).json({ 
        success: false,
        error: 'Sale not found' 
      });
    }

    const items = await Sale.getItemsBySaleId(id);
    
    // Formatear respuesta al formato deseado
    const response = {
      date: sale.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
      customer_id: sale.customer_id,
      payment: sale.payment,
      status: sale.status,
      customer_name: sale.first_name && sale.last_name 
        ? `${sale.first_name} ${sale.last_name}` 
        : 'Cliente no registrado',
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting sale by ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving sale',
      message: error.message 
    });
  }
};

exports.getSalesByCustomer = async (req, res) => {
  try {
    const { customer } = req.params;
    const sales = await Sale.getByCustomer(customer);
    
    res.json({
      success: true,
      data: sales,
      count: sales.length
    });
  } catch (error) {
    console.error('Error getting sales by customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving customer sales',
      message: error.message 
    });
  }
};

exports.getSalesByCustomerId = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const sales = await Sale.getByCustomerId(customer_id);
    
    res.json({
      success: true,
      data: sales,
      count: sales.length
    });
  } catch (error) {
    console.error('Error getting sales by customer ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving customer sales',
      message: error.message 
    });
  }
};

exports.getSalesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validar que el status sea válido
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }
    
    const sales = await Sale.getByStatus(status);
    
    res.json({
      success: true,
      data: sales,
      count: sales.length
    });
  } catch (error) {
    console.error('Error getting sales by status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving sales by status',
      message: error.message 
    });
  }
};

// Añadir esta función al controlador

exports.createSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, customer, items, ...saleData } = req.body;
    
    // 1. Manejar cliente existente o nuevo
    let customerId = customer_id;
    if (!customer_id && customer) {
      const [newCustomer] = await connection.query(
        'INSERT INTO customer (first_name, last_name) VALUES (?, ?)',
        [customer, '']
      );
      customerId = newCustomer.insertId;
    }

    // 2. Crear la venta
    const [saleResult] = await connection.query(
      `INSERT INTO sales (date, customer_id, total, status, payment) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        new Date().toISOString().split('T')[0], // Fecha actual
        customerId,
        saleData.total,
        'completed',
        saleData.payment
      ]
    );
    const saleId = saleResult.insertId;

    // 3. Crear items y actualizar stock
    for (const item of items) {
      // Insertar item de venta
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
      
      // Actualizar stock del producto
      await connection.query(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    
    // Obtener venta completa para respuesta
    const [sale] = await connection.query(
      `SELECT * FROM sales WHERE id = ?`,
      [saleId]
    );
    
    const [saleItems] = await connection.query(
      `SELECT * FROM sale_items WHERE sale_id = ?`,
      [saleId]
    );
    
    res.status(201).json({
      ...sale[0],
      items: saleItems
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando venta:', error);
    res.status(500).json({ 
      error: 'Error creating sale', 
      details: error.message
    });
  } finally {
    connection.release();
  }
  };

exports.updateSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { customer_id, customer, items, ...saleData } = req.body;
    
    // 1. Manejar cliente
    let customerId = customer_id;
    if (!customer_id && customer) {
      const [newCustomer] = await connection.query(
        'INSERT INTO customer (first_name, last_name) VALUES (?, ?)',
        [customer, '']
      );
      customerId = newCustomer.insertId;
    }

    // 2. Actualizar venta
    await connection.query(
      `UPDATE sales SET 
        customer_id = ?, 
        total = ?, 
        payment = ? 
       WHERE id = ?`,
      [customerId, saleData.total, saleData.payment, id]
    );

    // 3. Eliminar items antiguos
    await connection.query(
      `DELETE FROM sale_items WHERE sale_id = ?`,
      [id]
    );

    // 4. Insertar nuevos items
    for (const item of items) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [id, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
      
      // Actualizar stock (implementar lógica según necesidad)
    }

    await connection.commit();
    
    res.json({ 
      message: 'Venta actualizada correctamente',
      saleId: id
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      error: 'Error updating sale',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

exports.updateSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { customer_id, customer, items, ...saleData } = req.body;
    
    // Manejar cliente
    let customerId = customer_id;
    if (!customer_id && customer) {
      const [newCustomer] = await connection.query(
        'INSERT INTO customer (first_name, last_name) VALUES (?, ?)',
        [customer, '']
      );
      customerId = newCustomer.insertId;
    }

    // Actualizar venta
    await connection.query(
      `UPDATE sales SET 
        customer_id = ?, 
        total = ?, 
        payment = ? 
       WHERE id = ?`,
      [customerId, saleData.total, saleData.payment, id]
    );

    // Eliminar items antiguos
    await connection.query(
      `DELETE FROM sale_items WHERE sale_id = ?`,
      [id]
    );

    // Insertar nuevos items
    for (const item of items) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [id, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await connection.commit();
    
    res.json({ message: 'Venta actualizada correctamente' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      error: 'Error updating sale',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

exports.updateSaleStatus = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validar status
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }
    
    const existingSale = await Sale.getById(id);
    if (!existingSale) {
      return res.status(404).json({ 
        success: false,
        error: 'Sale not found' 
      });
    }

    // Manejar cambios de stock según el cambio de estado
    const items = await Sale.getItemsBySaleId(id);
    
    if (existingSale.status !== status) {
      for (const item of items) {
        const product = await Product.getById(item.product_id);
        if (product) {
          let newStock = product.stock;
          
          // Si cambia de pending/cancelled a completed, reducir stock
          if ((existingSale.status === 'pending' || existingSale.status === 'cancelled') && status === 'completed') {
            newStock = product.stock - item.quantity;
            if (newStock < 0) {
              throw new Error(`Insufficient stock for product ${product.name}`);
            }
          }
          // Si cambia de completed a pending/cancelled, aumentar stock
          else if (existingSale.status === 'completed' && (status === 'pending' || status === 'cancelled')) {
            newStock = product.stock + item.quantity;
          }
          
          if (newStock !== product.stock) {
            await Product.updateStock(item.product_id, newStock);
          }
        }
      }
    }
    
    const result = await Sale.updateStatus(id, status);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Sale not found' 
      });
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Sale status updated successfully',
      data: {
        id,
        status,
        previousStatus: existingSale.status
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating sale status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating sale status',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

exports.deleteSale = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const sale = await Sale.getById(id);
    
    if (!sale) {
      return res.status(404).json({ 
        success: false,
        error: 'Sale not found' 
      });
    }

    // No permitir eliminar ventas completadas
    if (sale.status === 'completed') {
      return res.status(400).json({ 
      success: false,
      error: 'No se pueden eliminar ventas completadas',
      solution: 'Cambie el estado a "cancelada" primero',
        currentStatus: sale.status
      });
    }

    // Obtener items para revertir stock si es necesario
    const items = await Sale.getItemsBySaleId(id);
    
    // Si la venta estaba completada, revertir el stock
    if (sale.status === 'completed') {
      for (const item of items) {
        const product = await Product.getById(item.product_id);
        if (product) {
          await Product.updateStock(item.product_id, product.stock + item.quantity);
        }
      }
    }

    // Eliminar los items primero (por restricción de clave foránea)
    await SaleItem.deleteBySaleId(id);
    
    // Eliminar la venta
    const result = await Sale.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Sale not found' 
      });
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Sale deleted successfully',
      data: { id }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting sale:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting sale',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

exports.getSalesByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required',
        format: 'YYYY-MM-DD'
      });
    }
    
    const sales = await Sale.getSalesByDateRange(start_date, end_date);
    
    res.json({
      success: true,
      data: sales,
      count: sales.length,
      dateRange: { start_date, end_date }
    });
  } catch (error) {
    console.error('Error getting sales by date range:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving sales by date range',
      message: error.message 
    });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const stats = await Sale.getTotalSales(start_date, end_date);
    
    res.json({
      success: true,
      data: {
        totalSales: stats.count || 0,
        totalAmount: parseFloat(stats.total_amount || 0),
        dateRange: start_date && end_date ? { start_date, end_date } : 'all_time'
      }
    });
  } catch (error) {
    console.error('Error getting sales stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving sales statistics',
      message: error.message 
    });
  }
};