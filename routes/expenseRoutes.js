const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Rutas CRUD básicas
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Rutas adicionales para reportes
router.get('/by-date/range', expenseController.getExpensesByDateRange);
router.get('/by-category/:category', expenseController.getExpensesByCategory);
router.get('/summary/category', expenseController.getExpenseSummary);

module.exports = router;