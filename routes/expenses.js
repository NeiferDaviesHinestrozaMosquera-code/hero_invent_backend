const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenses');

// Obtener todos los gastos con filtros
// GET /api/expenses?startDate=2023-01-01&endDate=2023-12-31&category=Inventario&minAmount=100&maxAmount=1000&includePurchase=true
router.get('/', expenseController.getAllExpenses);

// Obtener estadísticas de gastos
// GET /api/expenses/stats?startDate=2023-01-01&endDate=2023-12-31
router.get('/stats', expenseController.getExpensesStats);

// Obtener un gasto por ID
// GET /api/expenses/:id?includePurchase=true
router.get('/:id', expenseController.getExpenseById);

// Crear un nuevo gasto
// POST /api/expenses
router.post('/', expenseController.createExpense);

// Actualizar un gasto
// PUT /api/expenses/:id
router.put('/:id', expenseController.updateExpense);

// Eliminar un gasto
// DELETE /api/expenses/:id
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;