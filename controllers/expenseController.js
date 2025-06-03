const Expense = require('../models/Expense');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.getAll();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.getById(req.params.id);
    if (expense) {
      res.json(expense);
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpensesByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const expenses = await Expense.getByDateRange(start, end);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpensesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const expenses = await Expense.getByCategory(category);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.getTotalAmountByCategory();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.date || !req.body.description || !req.body.amount || !req.body.category) {
      return res.status(400).json({ error: 'Date, description, amount and category are required' });
    }
    
    const id = req.body.id || uuidv4();
    const newExpense = {
      id,
      date: req.body.date,
      description: req.body.description,
      amount: req.body.amount,
      category: req.body.category,
      purchase_id: req.body.purchase_id || null
    };

    const result = await Expense.create(newExpense);
    res.status(201).json({
      id,
      message: 'Expense created successfully',
      expense: newExpense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existingExpense = await Expense.getById(id);
    
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const updatedExpense = {
      date: req.body.date || existingExpense.date,
      description: req.body.description || existingExpense.description,
      amount: req.body.amount || existingExpense.amount,
      category: req.body.category || existingExpense.category,
      purchase_id: req.body.purchase_id !== undefined 
        ? req.body.purchase_id 
        : existingExpense.purchase_id
    };

    const result = await Expense.update(id, updatedExpense);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found or no changes made' });
    }
    
    res.json({
      id,
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.getById(id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const result = await Expense.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};