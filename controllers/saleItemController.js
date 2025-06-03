const SaleItem = require('../models/SaleItem');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');


exports.getAllSaleItems = async (req, res) => {
  try {
    const items = await SaleItem.getAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
///xxx

exports.getSaleItemById = async (req, res) => {
  try {
    const item = await SaleItem.getById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Sale item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSaleItem = async (req, res) => {
  try {
    if (!req.body.sale_id || !req.body.product_id || 
        !req.body.quantity || !req.body.price) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const id = req.body.id || uuidv4();
    const newItem = {
      id,
      sale_id: req.body.sale_id,
      product_id: req.body.product_id,
      quantity: req.body.quantity,
      price: req.body.price
    };

    const result = await SaleItem.create(newItem);
    res.status(201).json({
      id,
      message: 'Sale item created successfully',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSaleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existingItem = await SaleItem.getById(id);
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Sale item not found' });
    }

    const updatedItem = {
      quantity: req.body.quantity || existingItem.quantity,
      price: req.body.price || existingItem.price
    };

    const result = await SaleItem.update(id, updatedItem);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale item not found or no changes made' });
    }
    
    res.json({
      id,
      message: 'Sale item updated successfully',
      item: { ...existingItem, ...updatedItem }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSaleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SaleItem.getById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Sale item not found' });
    }

    const result = await SaleItem.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale item not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};