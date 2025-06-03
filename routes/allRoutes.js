const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController'); ///ESTO SE CAMBIA AL FINAL
const categoryController = require('../controllers/categoryController');
const expenseController = require('../controllers/expenseController');
const incomeController = require('../controllers/incomeController');
const purchaseItemController = require('../controllers/purchaseItemController');
const purchaseController = require('../controllers/purchaseController');
const saleItemController = require('../controllers/saleItemController');
const saleController = require('../controllers/saleController');
const supplierController = require('../controllers/supplierController');



///PRODUCTS
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts); // Nueva ruta de búsqueda
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/stock', productController.updateStock); // Nueva ruta para ajuste de stock


///CATEGORIES
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/products', categoryController.getCategoryProducts); // Productos por categoría
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);


///EXPENSE
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Rutas adicionales para reportes
router.get('/by-date/range', expenseController.getExpensesByDateRange);
router.get('/by-category/:category', expenseController.getExpensesByCategory);
router.get('/summary/category', expenseController.getExpenseSummary);


///INCOME
router.get('/', incomeController.getAllIncome);
router.get('/:id', incomeController.getIncomeById);
router.post('/', incomeController.createIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

// Rutas adicionales para reportes
router.get('/by-date/range', incomeController.getIncomeByDateRange);
router.get('/by-category/:category', incomeController.getIncomeByCategory);
router.get('/summary/category', incomeController.getIncomeSummary);
router.get('/sales/details', incomeController.getSalesIncomeDetails);


///PURCHASEITEM
router.get('/:id', purchaseItemController.getPurchaseItemById);
router.post('/', purchaseItemController.createPurchaseItem);
router.put('/:id', purchaseItemController.updatePurchaseItem);
router.delete('/:id', purchaseItemController.deletePurchaseItem);


///PURCHASE
router.get('/', purchaseController.getAllPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.get('/supplier/:supplier_id', purchaseController.getPurchasesBySupplier);
router.get('/status/:status', purchaseController.getPurchasesByStatus);
router.post('/', purchaseController.createPurchase);
router.put('/:id', purchaseController.updatePurchase);
router.patch('/:id/status', purchaseController.updatePurchaseStatus);
router.delete('/:id', purchaseController.deletePurchase);



///SALEITEM
router.get('/:id', saleItemController.getSaleItemById);
router.post('/', saleItemController.createSaleItem);
router.put('/:id', saleItemController.updateSaleItem);
router.delete('/:id', saleItemController.deleteSaleItem);


///SALEITEM
router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.get('/customer/:customer', saleController.getSalesByCustomer);
router.get('/status/:status', saleController.getSalesByStatus);
router.post('/', saleController.createSale);
router.put('/:id', saleController.updateSale);
router.patch('/:id/status', saleController.updateSaleStatus);
router.delete('/:id', saleController.deleteSale);


///SUPPLIER
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.get('/:id/products', supplierController.getSupplierProducts);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router