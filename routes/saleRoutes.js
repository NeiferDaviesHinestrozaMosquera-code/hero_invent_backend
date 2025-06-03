const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.get('/customer/:customer', saleController.getSalesByCustomer);
router.get('/status/:status', saleController.getSalesByStatus);
router.post('/', saleController.createSale);
router.put('/:id', saleController.updateSale);
router.patch('/:id/status', saleController.updateSaleStatus);
router.delete('/:id', saleController.deleteSale);

module.exports = router;