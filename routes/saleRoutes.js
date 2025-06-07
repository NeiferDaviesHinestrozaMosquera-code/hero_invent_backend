const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// Rutas básicas CRUD
router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.post('/', saleController.createSale);
router.put('/:id', saleController.updateSale);
router.delete('/:id', saleController.deleteSale);

// Rutas específicas para filtros
router.get('/customer/:customer', saleController.getSalesByCustomer);
router.get('/customer-id/:customer_id', saleController.getSalesByCustomerId);
router.get('/status/:status', saleController.getSalesByStatus);

// Rutas para consultas especiales
router.get('/date-range/search', saleController.getSalesByDateRange);
router.get('/stats/summary', saleController.getSalesStats);

// Ruta para actualizar solo el estado
router.patch('/:id/status', saleController.updateSaleStatus);

module.exports = router;