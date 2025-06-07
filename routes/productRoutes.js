const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas para obtener productos
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/stats', productController.getProductStats);
router.get('/category/:category_id', productController.getProductsByCategory);
router.get('/supplier/:supplier_id', productController.getProductsBySupplier);
router.get('/:id', productController.getProductById);

// Rutas para crear y modificar productos
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);

// Rutas para actualizaciones específicas
router.patch('/:id/stock', productController.updateProductStock);
router.patch('/:id/price', productController.updateProductPrice);
router.patch('/:id/cost', productController.updateProductCost);
router.patch('/:id/status', productController.updateProductStatus);

// Ruta para eliminar producto
router.delete('/:id', productController.deleteProduct);

module.exports = router;
