const express = require('express');
const router = express.Router();
const saleItemController = require('../controllers/saleItemController');

router.get('/', saleItemController.getAllSaleItems);
router.get('/:id', saleItemController.getSaleItemById);
router.post('/', saleItemController.createSaleItem);
router.put('/:id', saleItemController.updateSaleItem);
router.delete('/:id', saleItemController.deleteSaleItem);

module.exports = router;