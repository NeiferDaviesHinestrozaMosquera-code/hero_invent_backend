const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Ruta para obtener todos los productos
router.get('/', productController.getAllProducts);

// Ruta para buscar productos (debe ir antes de /:id para evitar conflictos)
router.get('/search', productController.searchProducts);

// Ruta para obtener productos por categoría
router.get('/category/:categoryId', productController.getProductsByCategory);

// Ruta para obtener un producto por ID
router.get('/:id', productController.getProductById);

// Ruta para crear un nuevo producto
router.post('/', productController.createProduct);

// Ruta para actualizar un producto
router.put('/:id', productController.updateProduct);

// Ruta para actualizar stock de un producto
router.patch('/:id/stock', productController.updateStock);

// Ruta para eliminar un producto
router.delete('/:id', productController.deleteProduct);

module.exports = router;