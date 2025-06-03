const Income = require('../models/Income');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAllIncome = async (req, res) => {
  try {
    const income = await Income.getAll();
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncomeById = async (req, res) => {
  try {
    const incomeRecord = await Income.getById(req.params.id);
    if (incomeRecord) {
      res.json(incomeRecord);
    } else {
      res.status(404).json({ error: 'Income record not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncomeByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const income = await Income.getByDateRange(start, end);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncomeByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const income = await Income.getByCategory(category);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncomeSummary = async (req, res) => {
  try {
    const summary = await Income.getTotalAmountByCategory();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalesIncomeDetails = async (req, res) => {
  try {
    const salesIncome = await Income.getSalesIncome();
    res.json(salesIncome);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createIncome = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.date || !req.body.description || !req.body.amount || !req.body.category) {
      return res.status(400).json({ error: 'Date, description, amount and category are required' });
    }
    
    const id = req.body.id || uuidv4();
    const newIncome = {
      id,
      date: req.body.date,
      description: req.body.description,
      amount: req.body.amount,
      category: req.body.category,
      sale_id: req.body.sale_id || null
    };

    const result = await Income.create(newIncome);
    res.status(201).json({
      id,
      message: 'Income record created successfully',
      income: newIncome
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const existingIncome = await Income.getById(id);
    
    if (!existingIncome) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    const updatedIncome = {
      date: req.body.date || existingIncome.date,
      description: req.body.description || existingIncome.description,
      amount: req.body.amount || existingIncome.amount,
      category: req.body.category || existingIncome.category,
      sale_id: req.body.sale_id !== undefined 
        ? req.body.sale_id 
        : existingIncome.sale_id
    };

    const result = await Income.update(id, updatedIncome);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found or no changes made' });
    }
    
    res.json({
      id,
      message: 'Income record updated successfully',
      income: updatedIncome
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const incomeRecord = await Income.getById(id);
    
    if (!incomeRecord) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    const result = await Income.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};