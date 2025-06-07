const express = require('express');
const router = express.Router();
const saleItemController = require('../controllers/saleItemController');

// ✅ Rutas principales CRUD
router.get('/', saleItemController.getAllSaleItems);
router.get('/:id', saleItemController.getSaleItemById);
router.post('/', saleItemController.createSaleItem);
router.put('/:id', saleItemController.updateSaleItem);
router.delete('/:id', saleItemController.deleteSaleItem);

// ✅ Rutas adicionales para elementos de venta
router.get('/sale/:sale_id', saleItemController.getSaleItemsBySaleId);
router.get('/product/:product_id', saleItemController.getSaleItemsByProduct);

module.exports = router;