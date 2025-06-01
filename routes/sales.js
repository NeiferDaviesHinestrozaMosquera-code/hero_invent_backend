const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sales');

// Obtener todas las ventas con filtros
// GET /api/sales?startDate=2023-01-01&endDate=2023-12-31&status=completed&customer=Nombre&minTotal=100&maxTotal=1000
router.get('/', saleController.getAllSales);

// Obtener estadísticas de ventas
// GET /api/sales/stats?startDate=2023-01-01&endDate=2023-12-31
router.get('/stats', saleController.getSalesStats);

// Obtener una venta por ID
// GET /api/sales/:id
router.get('/:id', saleController.getSaleById);

// Crear una nueva venta con items
// POST /api/sales
router.post('/', saleController.createSale);

// Actualizar una venta (principalmente estado)
// PUT /api/sales/:id
router.put('/:id', saleController.updateSale);

// Eliminar una venta (solo si está pendiente o cancelada)
// DELETE /api/sales/:id
router.delete('/:id', saleController.deleteSale);

module.exports = router;