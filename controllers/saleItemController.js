const SaleItem = require('../models/SaleItem');
const db = require('../config/db');

exports.getAllSaleItems = async (req, res) => {
  try {
    const items = await SaleItem.getAll();
    res.json(items);
  } catch (error) {
    console.error('Error getting sale items:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de venta'
    });
  }
};

exports.getSaleItemById = async (req, res) => {
  try {
    const item = await SaleItem.getById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ 
        error: 'Sale item not found',
        message: 'Elemento de venta no encontrado'
      });
    }
  } catch (error) {
    console.error('Error getting sale item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elemento de venta'
    });
  }
};

exports.createSaleItem = async (req, res) => {
  try {
    console.log('🔍 Request body recibido:', req.body);
    
    // ✅ VALIDACIÓN CRÍTICA: Rechazar cualquier intento de enviar ID
    if (req.body.id !== undefined) {
      console.log('❌ Rechazando request con ID proporcionado:', req.body.id);
      return res.status(400).json({ 
        error: 'ID field not allowed',
        message: 'No se debe proporcionar un ID. El sistema lo genera automáticamente.'
      });
    }

    // ✅ Aceptar solo los campos permitidos
    const { sale_id, product_id, quantity, price } = req.body;
    
    // Validación básica de campos requeridos
    if (!sale_id || !product_id || !quantity || price === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Todos los campos son obligatorios: sale_id, product_id, quantity, price',
        received: req.body
      });
    }

    // Validar tipos de datos
    const parsedQuantity = parseInt(quantity);
    const parsedPrice = parseFloat(price);
    const parsedProductId = parseInt(product_id);
    const parsedSaleId = parseInt(sale_id);
    
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'La cantidad debe ser un número válido mayor a 0'
      });
    }
    
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ 
        error: 'Invalid price',
        message: 'El precio debe ser un número válido mayor o igual a 0'
      });
    }
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID',
        message: 'El ID del producto debe ser un número válido'
      });
    }

    if (isNaN(parsedSaleId)) {
      return res.status(400).json({ 
        error: 'Invalid sale ID',
        message: 'El ID de la venta debe ser un número válido'
      });
    }

    // Verificar que el producto existe
    const productQuery = `SELECT id, name, price FROM products WHERE id = ?`;
    const [productRows] = await db.execute(productQuery, [parsedProductId]);
    
    if (productRows.length === 0) {
      return res.status(400).json({ 
        error: 'Product not found',
        message: `El producto con ID ${parsedProductId} no existe`
      });
    }

    // Verificar que la venta existe
    const saleQuery = `SELECT id FROM sales WHERE id = ?`;
    const [saleRows] = await db.execute(saleQuery, [parsedSaleId]);
    
    if (saleRows.length === 0) {
      return res.status(400).json({ 
        error: 'Sale not found',
        message: `La venta con ID ${parsedSaleId} no existe`
      });
    }

    // ✅ CREAR OBJETO LIMPIO - SIN ID
    const newItem = {
      sale_id: parsedSaleId,
      product_id: parsedProductId,
      quantity: parsedQuantity,
      price: parsedPrice
      // ✅ NO incluir: id, subtotal (se calcula automáticamente)
    };

    console.log('✅ Creando sale item SIN ID:', newItem);

    const result = await SaleItem.create(newItem);
    
    if (!result.insertId) {
      throw new Error('No se pudo obtener el ID del elemento creado');
    }

    console.log('✅ Sale item creado con ID:', result.insertId);
    
    // Obtener el item recién creado con todos sus datos
    const createdItem = await SaleItem.getById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      message: 'Sale item created successfully',
      item: createdItem
    });

  } catch (error) {
    console.error('❌ Error creating sale item:', error);
    
    // Manejo específico de errores de base de datos
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry error',
        message: 'Ya existe un elemento de venta con estos datos'
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: 'Foreign key constraint',
        message: 'Los IDs de producto o venta no son válidos'
      });
    }

    if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
      return res.status(400).json({ 
        error: 'Data out of range',
        message: 'Uno de los valores está fuera del rango permitido'
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      message: 'Error al crear elemento de venta'
    });
  }
};

exports.updateSaleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existingItem = await SaleItem.getById(id);
    
    if (!existingItem) {
      return res.status(404).json({ 
        error: 'Sale item not found',
        message: 'Elemento de venta no encontrado'
      });
    }

    // ✅ Solo actualizar campos permitidos (sin ID)
    const { sale_id, product_id, quantity, price } = req.body;
    
    const updatedItem = {
      sale_id: sale_id !== undefined ? parseInt(sale_id) : existingItem.sale_id,
      product_id: product_id !== undefined ? parseInt(product_id) : existingItem.product_id,
      quantity: quantity !== undefined ? parseInt(quantity) : existingItem.quantity,
      price: price !== undefined ? parseFloat(price) : existingItem.price
    };

    // Validaciones
    if (isNaN(updatedItem.quantity) || updatedItem.quantity <= 0) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'La cantidad debe ser un número válido mayor a 0'
      });
    }
    
    if (isNaN(updatedItem.price) || updatedItem.price < 0) {
      return res.status(400).json({ 
        error: 'Invalid price',
        message: 'El precio debe ser un número válido mayor o igual a 0'
      });
    }

    const result = await SaleItem.update(id, updatedItem);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Sale item not found or no changes made',
        message: 'Elemento de venta no encontrado o sin cambios'
      });
    }

    // Obtener el item actualizado
    const updated = await SaleItem.getById(id);
    
    res.json({
      id: parseInt(id),
      message: 'Sale item updated successfully',
      item: updated
    });
  } catch (error) {
    console.error('Error updating sale item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al actualizar elemento de venta'
    });
  }
};

exports.deleteSaleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SaleItem.getById(id);
    
    if (!item) {
      return res.status(404).json({ 
        error: 'Sale item not found',
        message: 'Elemento de venta no encontrado'
      });
    }

    const result = await SaleItem.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Sale item not found',
        message: 'Elemento de venta no encontrado'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting sale item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al eliminar elemento de venta'
    });
  }
};

// ✅ Función para obtener elementos de venta por ID de venta
exports.getSaleItemsBySaleId = async (req, res) => {
  try {
    const { sale_id } = req.params;
    
    // Validar que sale_id sea un número válido
    const parsedSaleId = parseInt(sale_id);
    if (isNaN(parsedSaleId)) {
      return res.status(400).json({ 
        error: 'Invalid sale ID',
        message: 'El ID de la venta debe ser un número válido'
      });
    }

    // Verificar que la venta existe
    const saleQuery = `SELECT id FROM sales WHERE id = ?`;
    const [saleRows] = await db.execute(saleQuery, [parsedSaleId]);
    
    if (saleRows.length === 0) {
      return res.status(404).json({ 
        error: 'Sale not found',
        message: `La venta con ID ${parsedSaleId} no existe`
      });
    }

    // Obtener todos los elementos de la venta
    const query = `
      SELECT 
        si.id,
        si.sale_id,
        si.product_id,
        si.quantity,
        si.price,
        si.subtotal,
        p.name AS product_name,
        p.price AS product_price
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
    `;
    
    const [items] = await db.execute(query, [parsedSaleId]);
    
    res.json({
      sale_id: parsedSaleId,
      total_items: items.length,
      items: items
    });
  } catch (error) {
    console.error('Error getting sale items by sale ID:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de venta por ID de venta'
    });
  }
};

// ✅ Función para obtener elementos de venta por ID de producto
exports.getSaleItemsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // Validar que product_id sea un número válido
    const parsedProductId = parseInt(product_id);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID',
        message: 'El ID del producto debe ser un número válido'
      });
    }

    // Verificar que el producto existe
    const productQuery = `SELECT id, name, price FROM products WHERE id = ?`;
    const [productRows] = await db.execute(productQuery, [parsedProductId]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: `El producto con ID ${parsedProductId} no existe`
      });
    }

    // Obtener todos los elementos de venta para este producto
    const query = `
      SELECT 
        si.id,
        si.sale_id,
        si.product_id,
        si.quantity,
        si.price,
        si.subtotal,
        s.date AS sale_date,
        s.total_amount AS sale_total,
        c.name AS customer_name
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE si.product_id = ?
      ORDER BY s.date DESC, si.id ASC
    `;
    
    const [items] = await db.execute(query, [parsedProductId]);
    
    res.json({
      product_id: parsedProductId,
      product_name: productRows[0].name,
      total_sales: items.length,
      items: items
    });
  } catch (error) {
    console.error('Error getting sale items by product ID:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de venta por ID de producto'
    });
  }
};
