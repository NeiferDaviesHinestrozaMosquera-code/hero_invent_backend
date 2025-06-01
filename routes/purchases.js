const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchases');

// Obtener todas las compras con filtros
// GET /api/purchases?startDate=2023-01-01&endDate=2023-12-31&status=received&supplierId=1&minTotal=100&maxTotal=1000
router.get('/', purchaseController.getAllPurchases);

// Obtener estadísticas de compras
// GET /api/purchases/stats?startDate=2023-01-01&endDate=2023-12-31&supplierId=1
router.get('/stats', purchaseController.getPurchaseStats);

// Obtener una compra por ID
// GET /api/purchases/:id
router.get('/:id', purchaseController.getPurchaseById);

// Crear una nueva compra con items
// POST /api/purchases
router.post('/', purchaseController.createPurchase);

// Actualizar una compra (principalmente estado)
// PUT /api/purchases/:id
router.put('/:id', purchaseController.updatePurchase);

// Eliminar una compra (solo si está pendiente)
// DELETE /api/purchases/:id
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;