const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.getAll();
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.getById(req.params.id);
    if (purchase) {
      // Obtener los items de la compra
      const items = await Purchase.getItemsBypurchase_id(req.params.id);
      res.json({ ...purchase, items });
    } else {
      res.status(404).json({ error: 'Purchase not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchasesBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    const purchases = await Purchase.getBySupplier(supplier_id);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchasesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const purchases = await Purchase.getByStatus(status);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.date || !req.body.supplier_id) {
      return res.status(400).json({ error: 'Date and supplier are required' });
    }
    
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    // Calcular total
    const total = req.body.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    
    const id = req.body.id || uuidv4();
    const newPurchase = {
      id,
      date: req.body.date,
      supplier_id: req.body.supplier_id,
      total,
      status: req.body.status || 'pending'
    };

    // Crear la compra
    await Purchase.create(newPurchase);
    
    // Crear los items de la compra
    for (const item of req.body.items) {
      const itemId = uuidv4();
      await PurchaseItem.create({
        id: itemId,
        purchase_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        cost: item.cost
      });
    }

    res.status(201).json({
      id,
      message: 'Purchase created successfully',
      purchase: newPurchase,
      items: req.body.items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const existingPurchase = await Purchase.getById(id);
    
    if (!existingPurchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Calcular nuevo total si se proporcionan items
    let total = existingPurchase.total;
    if (req.body.items && Array.isArray(req.body.items)) {
      total = req.body.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    }

    const updatedPurchase = {
      date: req.body.date || existingPurchase.date,
      supplier_id: req.body.supplier_id || existingPurchase.supplier_id,
      total,
      status: req.body.status || existingPurchase.status
    };

    // Actualizar la compra
    const result = await Purchase.update(id, updatedPurchase);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase not found or no changes made' });
    }
    
    // Si se proporcionaron items, actualizarlos
    if (req.body.items && Array.isArray(req.body.items)) {
      // Eliminar items existentes
      await PurchaseItem.deleteBypurchase_id(id);
      
      // Crear nuevos items
      for (const item of req.body.items) {
        const itemId = uuidv4();
        await PurchaseItem.create({
          id: itemId,
          purchase_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          cost: item.cost
        });
      }
    }
    
    res.json({
      id,
      message: 'Purchase updated successfully',
      purchase: updatedPurchase,
      items: req.body.items || await Purchase.getItemsBypurchase_id(id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await Purchase.updateStatus(id, status);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    res.json({
      id,
      message: 'Purchase status updated successfully',
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.getById(id);
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // No permitir eliminar compras recibidas
    if (purchase.status === 'received') {
      return res.status(400).json({ 
        error: 'Cannot delete received purchases',
        solution: 'Change status to cancelled first'
      });
    }

    // Eliminar los items primero (o usar ON DELETE CASCADE en la BD)
    await PurchaseItem.deleteBypurchase_id(id);
    
    // Eliminar la compra
    const result = await Purchase.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};