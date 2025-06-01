const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const { Product, Category, Supplier } = require('../models');

// Rutas para productos
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;