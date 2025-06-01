const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/income');

// Obtener todos los ingresos con filtros
// GET /api/income?startDate=2023-01-01&endDate=2023-12-31&category=Ventas&minAmount=100&maxAmount=1000&includeSale=true
router.get('/', incomeController.getAllIncome);

// Obtener estadísticas de ingresos
// GET /api/income/stats?startDate=2023-01-01&endDate=2023-12-31
router.get('/stats', incomeController.getIncomeStats);

// Obtener un ingreso por ID
// GET /api/income/:id?includeSale=true
router.get('/:id', incomeController.getIncomeById);

// Crear un nuevo ingreso
// POST /api/income
router.post('/', incomeController.createIncome);

// Actualizar un ingreso
// PUT /api/income/:id
router.put('/:id', incomeController.updateIncome);

// Eliminar un ingreso
// DELETE /api/income/:id
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;