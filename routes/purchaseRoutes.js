const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.get('/', purchaseController.getAllPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.get('/supplier/:supplier_id', purchaseController.getPurchasesBySupplier);
router.get('/status/:status', purchaseController.getPurchasesByStatus);
router.post('/', purchaseController.createPurchase);
router.put('/:id', purchaseController.updatePurchase);
router.patch('/:id/status', purchaseController.updatePurchaseStatus);
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;