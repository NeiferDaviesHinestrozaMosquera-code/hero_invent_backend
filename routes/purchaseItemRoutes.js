const express = require('express');
const router = express.Router();
const purchaseItemController = require('../controllers/purchaseItemController');

router.get('/', purchaseItemController.getAllPurchaseItems);
router.get('/:id', purchaseItemController.getPurchaseItemById);
router.post('/', purchaseItemController.createPurchaseItem);
router.put('/:id', purchaseItemController.updatePurchaseItem);
router.delete('/:id', purchaseItemController.deletePurchaseItem);

module.exports = router;