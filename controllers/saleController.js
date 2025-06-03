const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.getAll();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.getById(req.params.id);
    if (sale) {
      const items = await Sale.getItemsBysale_id(req.params.id);
      res.json({ ...sale, items });
    } else {
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalesByCustomer = async (req, res) => {
  try {
    const { customer } = req.params;
    const sales = await Sale.getByCustomer(customer);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const sales = await Sale.getByStatus(status);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSale = async (req, res) => {
  try {
    if (!req.body.date || !req.body.customer) {
      return res.status(400).json({ error: 'Date and customer are required' });
    }
    
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    // Calcular total
    const total = req.body.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    const id = req.body.id || uuidv4();
    const newSale = {
      id,
      date: req.body.date,
      customer: req.body.customer,
      total,
      status: req.body.status || 'pending'
    };

    // Crear la venta
    await Sale.create(newSale);
    
    // Crear los items de la venta
    for (const item of req.body.items) {
      const itemId = uuidv4();
      await SaleItem.create({
        id: itemId,
        sale_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      });
    }

    res.status(201).json({
      id,
      message: 'Sale created successfully',
      sale: newSale,
      items: req.body.items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const existingSale = await Sale.getById(id);
    
    if (!existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Calcular nuevo total si se proporcionan items
    let total = existingSale.total;
    if (req.body.items && Array.isArray(req.body.items)) {
      total = req.body.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    const updatedSale = {
      date: req.body.date || existingSale.date,
      customer: req.body.customer || existingSale.customer,
      total,
      status: req.body.status || existingSale.status
    };

    // Actualizar la venta
    const result = await Sale.update(id, updatedSale);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale not found or no changes made' });
    }
    
    // Si se proporcionaron items, actualizarlos
    if (req.body.items && Array.isArray(req.body.items)) {
      // Eliminar items existentes
      await SaleItem.deleteBysale_id(id);
      
      // Crear nuevos items
      for (const item of req.body.items) {
        const itemId = uuidv4();
        await SaleItem.create({
          id: itemId,
          sale_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        });
      }
    }
    
    res.json({
      id,
      message: 'Sale updated successfully',
      sale: updatedSale,
      items: req.body.items || await Sale.getItemsBysale_id(id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await Sale.updateStatus(id, status);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json({
      id,
      message: 'Sale status updated successfully',
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.getById(id);
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // No permitir eliminar ventas completadas
    if (sale.status === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot delete completed sales',
        solution: 'Change status to cancelled first'
      });
    }

    // Eliminar los items primero
    await SaleItem.deleteBysale_id(id);
    
    // Eliminar la venta
    const result = await Sale.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};