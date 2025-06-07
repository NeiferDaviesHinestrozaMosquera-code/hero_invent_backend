const PurchaseItem = require('../models/PurchaseItem');
const db = require('../config/db');

exports.getAllPurchaseItems = async (req, res) => {
  try {
    const items = await PurchaseItem.getAll();
    res.json(items);
  } catch (error) {
    console.error('Error getting purchase items:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de compra'
    });
  }
};

exports.getPurchaseItemById = async (req, res) => {
  try {
    const item = await PurchaseItem.getById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ 
        error: 'Purchase item not found',
        message: 'Elemento de compra no encontrado'
      });
    }
  } catch (error) {
    console.error('Error getting purchase item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elemento de compra'
    });
  }
};

exports.createPurchaseItem = async (req, res) => {
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
    const { purchase_id, product_id, quantity, cost } = req.body;
    
    // Validación básica de campos requeridos
    if (!purchase_id || !product_id || !quantity || cost === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Todos los campos son obligatorios: purchase_id, product_id, quantity, cost',
        received: req.body
      });
    }

    // Validar tipos de datos
    const parsedQuantity = parseInt(quantity);
    const parsedCost = parseFloat(cost);
    const parsedProductId = parseInt(product_id);
    const parsedPurchaseId = parseInt(purchase_id);
    
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'La cantidad debe ser un número válido mayor a 0'
      });
    }
    
    if (isNaN(parsedCost) || parsedCost < 0) {
      return res.status(400).json({ 
        error: 'Invalid cost',
        message: 'El costo debe ser un número válido mayor o igual a 0'
      });
    }
    
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID',
        message: 'El ID del producto debe ser un número válido'
      });
    }

    if (isNaN(parsedPurchaseId)) {
      return res.status(400).json({ 
        error: 'Invalid purchase ID',
        message: 'El ID de la compra debe ser un número válido'
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

    // Verificar que la compra existe
    const purchaseQuery = `SELECT id FROM purchases WHERE id = ?`;
    const [purchaseRows] = await db.execute(purchaseQuery, [parsedPurchaseId]);
    
    if (purchaseRows.length === 0) {
      return res.status(400).json({ 
        error: 'Purchase not found',
        message: `La compra con ID ${parsedPurchaseId} no existe`
      });
    }

    // ✅ CREAR OBJETO LIMPIO - SIN ID
    const newItem = {
      purchase_id: parsedPurchaseId,
      product_id: parsedProductId,
      quantity: parsedQuantity,
      cost: parsedCost
      // ✅ NO incluir: id, subtotal (se calcula automáticamente)
    };

    console.log('✅ Creando purchase item SIN ID:', newItem);

    const result = await PurchaseItem.create(newItem);
    
    if (!result.insertId) {
      throw new Error('No se pudo obtener el ID del elemento creado');
    }

    console.log('✅ Purchase item creado con ID:', result.insertId);
    
    // Obtener el item recién creado con todos sus datos
    const createdItem = await PurchaseItem.getById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      message: 'Purchase item created successfully',
      item: createdItem
    });

  } catch (error) {
    console.error('❌ Error creating purchase item:', error);
    
    // Manejo específico de errores de base de datos
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry error',
        message: 'Ya existe un elemento de compra con estos datos'
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: 'Foreign key constraint',
        message: 'Los IDs de producto o compra no son válidos'
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
      message: 'Error al crear elemento de compra'
    });
  }
};

exports.updatePurchaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existingItem = await PurchaseItem.getById(id);
    
    if (!existingItem) {
      return res.status(404).json({ 
        error: 'Purchase item not found',
        message: 'Elemento de compra no encontrado'
      });
    }

    // ✅ Solo actualizar campos permitidos (sin ID)
    const { purchase_id, product_id, quantity, cost } = req.body;
    
    const updatedItem = {
      purchase_id: purchase_id !== undefined ? parseInt(purchase_id) : existingItem.purchase_id,
      product_id: product_id !== undefined ? parseInt(product_id) : existingItem.product_id,
      quantity: quantity !== undefined ? parseInt(quantity) : existingItem.quantity,
      cost: cost !== undefined ? parseFloat(cost) : existingItem.cost
    };

    // Validaciones
    if (isNaN(updatedItem.quantity) || updatedItem.quantity <= 0) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'La cantidad debe ser un número válido mayor a 0'
      });
    }
    
    if (isNaN(updatedItem.cost) || updatedItem.cost < 0) {
      return res.status(400).json({ 
        error: 'Invalid cost',
        message: 'El costo debe ser un número válido mayor o igual a 0'
      });
    }

    const result = await PurchaseItem.update(id, updatedItem);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Purchase item not found or no changes made',
        message: 'Elemento de compra no encontrado o sin cambios'
      });
    }

    // Obtener el item actualizado
    const updated = await PurchaseItem.getById(id);
    
    res.json({
      id: parseInt(id),
      message: 'Purchase item updated successfully',
      item: updated
    });
  } catch (error) {
    console.error('Error updating purchase item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al actualizar elemento de compra'
    });
  }
};

exports.deletePurchaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await PurchaseItem.getById(id);
    
    if (!item) {
      return res.status(404).json({ 
        error: 'Purchase item not found',
        message: 'Elemento de compra no encontrado'
      });
    }

    const result = await PurchaseItem.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Purchase item not found',
        message: 'Elemento de compra no encontrado'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting purchase item:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al eliminar elemento de compra'
    });
  }
};

// ✅ Función para obtener elementos de compra por ID de compra
exports.getPurchaseItemsByPurchaseId = async (req, res) => {
  try {
    const { purchase_id } = req.params;
    
    // Validar que purchase_id sea un número válido
    const parsedPurchaseId = parseInt(purchase_id);
    if (isNaN(parsedPurchaseId)) {
      return res.status(400).json({ 
        error: 'Invalid purchase ID',
        message: 'El ID de la compra debe ser un número válido'
      });
    }

    // Verificar que la compra existe
    const purchaseQuery = `SELECT id FROM purchases WHERE id = ?`;
    const [purchaseRows] = await db.execute(purchaseQuery, [parsedPurchaseId]);
    
    if (purchaseRows.length === 0) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: `La compra con ID ${parsedPurchaseId} no existe`
      });
    }

    // Obtener todos los elementos de la compra
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        p.name AS product_name,
        p.price AS product_price
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
      ORDER BY pi.id ASC
    `;
    
    const [items] = await db.execute(query, [parsedPurchaseId]);
    
    res.json({
      purchase_id: parsedPurchaseId,
      total_items: items.length,
      items: items
    });
  } catch (error) {
    console.error('Error getting purchase items by purchase ID:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de compra por ID de compra'
    });
  }
};

// ✅ Función para obtener elementos de compra por ID de producto
exports.getPurchaseItemsByProduct = async (req, res) => {
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

    // Obtener todos los elementos de compra para este producto
    const query = `
      SELECT 
        pi.id,
        pi.purchase_id,
        pi.product_id,
        pi.quantity,
        pi.cost,
        pi.subtotal,
        pur.date AS purchase_date,
        pur.total_amount AS purchase_total,
        s.name AS supplier_name
      FROM purchase_items pi
      JOIN purchases pur ON pi.purchase_id = pur.id
      LEFT JOIN suppliers s ON pur.supplier_id = s.id
      WHERE pi.product_id = ?
      ORDER BY pur.date DESC, pi.id ASC
    `;
    
    const [items] = await db.execute(query, [parsedProductId]);
    
    res.json({
      product_id: parsedProductId,
      product_name: productRows[0].name,
      total_purchases: items.length,
      items: items
    });
  } catch (error) {
    console.error('Error getting purchase items by product ID:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener elementos de compra por ID de producto'
    });
  }
};
