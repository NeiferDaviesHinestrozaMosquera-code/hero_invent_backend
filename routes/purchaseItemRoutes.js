const express = require('express');
const router = express.Router();
const purchaseItemController = require('../controllers/purchaseItemController');

// Rutas principales
router.get('/', purchaseItemController.getAllPurchaseItems);
router.get('/:id', purchaseItemController.getPurchaseItemById);
router.post('/', purchaseItemController.createPurchaseItem);
router.put('/:id', purchaseItemController.updatePurchaseItem);
router.delete('/:id', purchaseItemController.deletePurchaseItem);

// ✅ Rutas adicionales para mejor funcionalidad
router.get('/purchase/:purchase_id', purchaseItemController.getPurchaseItemsByPurchaseId);
router.get('/product/:product_id', purchaseItemController.getPurchaseItemsByProduct);

module.exports = router;
