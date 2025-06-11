const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');
const db = require('../config/db');

exports.getAllSales = async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT sales.*, 
        customer.first_name, 
        customer.last_name,
        customer.email,
        customer.phone,
        customer.address
      FROM sales
      LEFT JOIN customer ON sales.customer_id = customer.id
      ORDER BY sales.created_at DESC
    `);
    
    // Obtener items para cada venta y formatear
    const formattedSales = await Promise.all(sales.map(async sale => {
      const items = await Sale.getItemsBySaleId(sale.id);
      
      // Calcular total si no está presente o es 0
      let calculatedTotal = sale.total;
      if (!calculatedTotal || calculatedTotal === 0) {
        calculatedTotal = items.reduce((sum, item) => 
          sum + (item.quantity * item.price), 0
        );
      }
      
      return {
        id: sale.id, // ✅ Incluir ID de la base de datos
        date: sale.date.toISOString().split('T')[0],
        customer_id: sale.customer_id,
        customer: sale.first_name && sale.last_name 
          ? `${sale.first_name} ${sale.last_name}` 
          : 'Cliente no registrado',
        total: parseFloat(calculatedTotal), // ✅ Total correcto
        payment: sale.payment,
        status: sale.status,
        created_at: sale.created_at,
        updated_at: sale.updated_at,
        // Información adicional del cliente
        customer_info: {
          first_name: sale.first_name,
          last_name: sale.last_name,
          email: sale.email,
          phone: sale.phone,
          address: sale.address
        },
        items: items.map(item => ({
          id: item.id,
          sale_id: sale.id,
          product_id: item.product_id,
          product_name: item.product_name || 'Producto',
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.quantity * item.price
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
    
    // Calcular total si no está presente o es 0
    let calculatedTotal = sale.total;
    if (!calculatedTotal || calculatedTotal === 0) {
      calculatedTotal = items.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );
    }
    
    // Formatear respuesta completa
    const response = {
      id: sale.id, // ✅ Incluir ID
      date: sale.date.toISOString().split('T')[0],
      customer_id: sale.customer_id,
      customer: sale.first_name && sale.last_name 
        ? `${sale.first_name} ${sale.last_name}` 
        : 'Cliente no registrado',
      total: parseFloat(calculatedTotal), // ✅ Total correcto
      payment: sale.payment,
      status: sale.status,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      // Información completa del cliente
      customer_info: {
        first_name: sale.first_name,
        last_name: sale.last_name,
        email: sale.email,
        phone: sale.phone,
        address: sale.address
      },
      items: items.map(item => ({
        id: item.id,
        sale_id: id,
        product_id: item.product_id,
        product_name: item.product_name || 'Producto',
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.quantity * item.price
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
  try {
    const { customer, customer_id, total, status, payment, items } = req.body;

    // Validar que se proporcione customer o customer_id
    if (!customer && !customer_id) {
      return res.status(400).json({ error: 'Customer name or customer_id is required' });
    }

    // Crear la venta
    const saleData = {
      customer,
      customer_id,
      total,
      status,
      payment,
      items // Incluir items en el cuerpo
    };

    const createdSale = await Sale.create(saleData);

    // Actualizar el stock de los productos
     if (items && Array.isArray(items)) {
      for (const item of items) {
        await Product.updateStock(item.product_id, item.quantity);
      }
    }
    
    // Devolver la venta creada con el ID
    return res.status(201).json({
      id: createdSale.insertId,
      date: req.body.date || new Date().toISOString().split('T')[0],
      customer,
      customer_id,
      total,
      status,
      payment,
      items // Incluir items en la respuesta
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return res.status(500).json({ error: 'Error creating sale', details: error.message });
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