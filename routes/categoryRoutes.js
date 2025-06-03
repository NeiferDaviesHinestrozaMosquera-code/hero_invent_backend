const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const db = require('../config/db');

// Obtener todas las categorías
// GET /api/categories?includeProducts=true
router.get('/', categoryController.getAllCategories);

// Buscar categorías por nombre
// GET /api/categories/search?query=texto
router.get('/search', categoryController.searchCategories);

// Obtener una categoría por ID
// GET /api/categories/:id?includeProducts=true
router.get('/:id', categoryController.getCategoryById);

// Crear una nueva categoría
// POST /api/categories
router.post('/', categoryController.createCategory);

// Actualizar una categoría
// PUT /api/categories/:id
router.put('/:id', categoryController.updateCategory);

// Eliminar una categoría
// DELETE /api/categories/:id
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;