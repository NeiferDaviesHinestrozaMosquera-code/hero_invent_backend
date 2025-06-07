const express = require('express');
const router = express.Router();

// Importar controladores
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const expenseController = require('../controllers/expenseController');
const incomeController = require('../controllers/incomeController');
const purchaseItemController = require('../controllers/purchaseItemController');
const purchaseController = require('../controllers/purchaseController');
const saleItemController = require('../controllers/saleItemController');
const saleController = require('../controllers/saleController');
const supplierController = require('../controllers/supplierController');
const customerController = require('../controllers/customerController');

// ===== RUTAS DE PRODUCTOS =====
router.get('/products', productController.getAllProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.patch('/products/:id/stock', productController.updateStock);

// ===== RUTAS DE CATEGORÍAS =====
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/categories/:id/products', categoryController.getCategoryProducts);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// ===== RUTAS DE GASTOS =====
router.get('/expenses', expenseController.getAllExpenses);
router.get('/expenses/by-date/range', expenseController.getExpensesByDateRange);
router.get('/expenses/by-category/:category', expenseController.getExpensesByCategory);
router.get('/expenses/summary/category', expenseController.getExpenseSummary);
router.get('/expenses/:id', expenseController.getExpenseById);
router.post('/expenses', expenseController.createExpense);
router.put('/expenses/:id', expenseController.updateExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);

// ===== RUTAS DE INGRESOS =====
router.get('/income', incomeController.getAllIncome);
router.get('/income/by-date/range', incomeController.getIncomeByDateRange);
router.get('/income/by-category/:category', incomeController.getIncomeByCategory);
router.get('/income/summary/category', incomeController.getIncomeSummary);
router.get('/income/sales/details', incomeController.getSalesIncomeDetails);
router.get('/income/:id', incomeController.getIncomeById);
router.post('/income', incomeController.createIncome);
router.put('/income/:id', incomeController.updateIncome);
router.delete('/income/:id', incomeController.deleteIncome);

// ===== RUTAS DE COMPRAS =====
router.get('/purchases', purchaseController.getAllPurchases);
router.get('/purchases/supplier/:supplier_id', purchaseController.getPurchasesBySupplier);
router.get('/purchases/status/:status', purchaseController.getPurchasesByStatus);
router.get('/purchases/:id', purchaseController.getPurchaseById);
router.post('/purchases', purchaseController.createPurchase);
router.put('/purchases/:id', purchaseController.updatePurchase);
router.patch('/purchases/:id/status', purchaseController.updatePurchaseStatus);
router.delete('/purchases/:id', purchaseController.deletePurchase);

// ===== RUTAS DE ITEMS DE COMPRA =====
router.get('/purchase_items/purchase/:purchase_id', purchaseItemController.getPurchaseItemsByPurchaseId);
router.get('/purchase_items/:id', purchaseItemController.getPurchaseItemById);
router.post('/purchase_items', purchaseItemController.createPurchaseItem);
router.put('/purchase_items/:id', purchaseItemController.updatePurchaseItem);
router.delete('/purchase_items/:id', purchaseItemController.deletePurchaseItem);

// ===== RUTAS DE VENTAS =====
router.get('/sales', saleController.getAllSales);
router.get('/sales/customer/:customer_id', saleController.getSalesByCustomer);
router.get('/sales/status/:status', saleController.getSalesByStatus);
router.get('/sales/:id', saleController.getSaleById);
router.post('/sales', saleController.createSale);
router.put('/sales/:id', saleController.updateSale);
router.patch('/sales/:id/status', saleController.updateSaleStatus);
router.delete('/sales/:id', saleController.deleteSale);

// ===== RUTAS DE ITEMS DE VENTA =====
router.get('/sale_items', saleItemController.getAllSaleItems);
router.get('/sale_items/sale/:sale_id', saleItemController.getSaleItemsBySaleId);
router.get('/sale_items/sale/:sale_id/total', saleItemController.getSaleTotal);
router.get('/sale_items/:id', saleItemController.getSaleItemById);
router.post('/sale_items', saleItemController.createSaleItem);
router.put('/sale_items/:id', saleItemController.updateSaleItem);
router.delete('/sale_items/:id', saleItemController.deleteSaleItem);

// ===== RUTAS DE PROVEEDORES =====
router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.get('/suppliers/:id/products', supplierController.getSupplierProducts);
router.post('/suppliers', supplierController.createSupplier);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

// ===== RUTAS DE CLIENTES =====
router.get('/customer', customerController.getAllCustomers);
router.get('/customer/search', customerController.searchCustomers);
router.get('/customer/:id', customerController.getCustomerById);
router.post('/customer', customerController.createCustomer);
router.put('/customer/:id', customerController.updateCustomer);
router.delete('/customer/:id', customerController.deleteCustomer);

module.exports = router;