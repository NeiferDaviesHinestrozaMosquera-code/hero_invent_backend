const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');

// Rutas CRUD básicas
router.get('/', incomeController.getAllIncome);
router.get('/:id', incomeController.getIncomeById);
router.post('/', incomeController.createIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

// Rutas adicionales para reportes
router.get('/by-date/range', incomeController.getIncomeByDateRange);
router.get('/by-category/:category', incomeController.getIncomeByCategory);
router.get('/summary/category', incomeController.getIncomeSummary);
router.get('/sales/details', incomeController.getSalesIncomeDetails);

module.exports = router;