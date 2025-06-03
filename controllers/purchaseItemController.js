const PurchaseItem = require('../models/PurchaseItem');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAllPurchaseItems = async (req, res) => {
  try {
    const items = await PurchaseItem.getAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchaseItemById = async (req, res) => {
  try {
    const item = await PurchaseItem.getById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Purchase item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPurchaseItem = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.purchase_id || !req.body.product_id || 
        !req.body.quantity || !req.body.cost) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const id = req.body.id || uuidv4();
    const newItem = {
      id,
      purchase_id: req.body.purchase_id,
      product_id: req.body.product_id,
      quantity: req.body.quantity,
      cost: req.body.cost
    };

    const result = await PurchaseItem.create(newItem);
    res.status(201).json({
      id,
      message: 'Purchase item created successfully',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePurchaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existingItem = await PurchaseItem.getById(id);
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Purchase item not found' });
    }

    const updatedItem = {
      quantity: req.body.quantity || existingItem.quantity,
      cost: req.body.cost || existingItem.cost
    };

    const result = await PurchaseItem.update(id, updatedItem);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase item not found or no changes made' });
    }
    
    res.json({
      id,
      message: 'Purchase item updated successfully',
      item: { ...existingItem, ...updatedItem }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePurchaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await PurchaseItem.getById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Purchase item not found' });
    }

    const result = await PurchaseItem.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase item not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};