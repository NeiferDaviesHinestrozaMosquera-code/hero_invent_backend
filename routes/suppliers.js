const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/suppliers');

// Obtener todos los proveedores
// GET /api/suppliers?includeProducts=true&includePurchases=true&search=texto
router.get('/', supplierController.getAllSuppliers);

// Buscar proveedores
// GET /api/suppliers/search?query=texto
router.get('/search', supplierController.searchSuppliers);

// Obtener un proveedor por ID
// GET /api/suppliers/:id?includeProducts=true&includePurchases=true
router.get('/:id', supplierController.getSupplierById);

// Crear un nuevo proveedor
// POST /api/suppliers
router.post('/', supplierController.createSupplier);

// Actualizar un proveedor
// PUT /api/suppliers/:id
router.put('/:id', supplierController.updateSupplier);

// Eliminar un proveedor
// DELETE /api/suppliers/:id
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;