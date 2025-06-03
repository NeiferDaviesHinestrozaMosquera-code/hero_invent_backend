const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const Product = require('../models/Product');


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.getByCategory(req.params.categoryId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const [products] = await db.query(
      `SELECT * FROM products 
       WHERE name LIKE ? OR description LIKE ? OR sku LIKE ? OR barcode LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Validación básica de campos requeridos
    if (!req.body.name || !req.body.price || !req.body.cost) {
      return res.status(400).json({ error: 'Name, price and cost are required fields' });
    }
    
    // Generar ID único si no se proporciona
    const id = req.body.id || uuidv4();
    
    const newProduct = {
      id,
      name: req.body.name,
      description: req.body.description || null,
      price: req.body.price,
      cost: req.body.cost,
      stock: req.body.stock || 0,
      min_stock: req.body.min_stock || 0,
      category_id: req.body.category_id || null,
      supplier_id: req.body.supplier_id || null,
      sku: req.body.sku || '',
      barcode: req.body.barcode || null,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      image: req.body.image || null
    };

    const result = await Product.create(newProduct);
    res.status(201).json({
      id,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    // Manejo específico de errores de duplicación
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Duplicate entry',
        field: error.message.includes('sku') ? 'SKU' : 'barcode'
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el producto existe
    const existingProduct = await Product.getById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Construir objeto actualizado
    const updatedProduct = {
      name: req.body.name || existingProduct.name,
      description: req.body.description !== undefined 
        ? req.body.description 
        : existingProduct.description,
      price: req.body.price || existingProduct.price,
      cost: req.body.cost || existingProduct.cost,
      stock: req.body.stock !== undefined 
        ? req.body.stock 
        : existingProduct.stock,
      min_stock: req.body.min_stock !== undefined 
        ? req.body.min_stock 
        : existingProduct.min_stock,
      category_id: req.body.category_id || existingProduct.category_id,
      supplier_id: req.body.supplier_id || existingProduct.supplier_id,
      sku: req.body.sku || existingProduct.sku,
      barcode: req.body.barcode !== undefined 
        ? req.body.barcode 
        : existingProduct.barcode,
      is_active: req.body.is_active !== undefined 
        ? req.body.is_active 
        : existingProduct.is_active,
      image: req.body.image !== undefined 
        ? req.body.image 
        : existingProduct.image
    };

    const result = await Product.update(id, updatedProduct);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or no changes made' });
    }
    
    res.json({
      id,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    // Manejo específico de errores de duplicación
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Duplicate entry',
        field: error.message.includes('sku') ? 'SKU' : 'barcode'
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el producto existe
    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verificar si hay stock antes de eliminar
    if (product.stock > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with existing stock',
        current_stock: product.stock
      });
    }

    const result = await Product.delete(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    // Manejar errores de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        error: 'Cannot delete product referenced in sales or purchases'
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Invalid adjustment value' });
    }
    
    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newStock = product.stock + adjustment;
    if (newStock < 0) {
      return res.status(400).json({ 
        error: 'Insufficient stock for adjustment',
        current_stock: product.stock,
        attempted_adjustment: adjustment
      });
    }
    
    // Actualizar el stock
    await db.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, id]);
    
    // Aquí podrías registrar este movimiento en una tabla de historial de inventario
    res.json({
      id,
      message: 'Stock updated successfully',
      previous_stock: product.stock,
      new_stock: newStock,
      adjustment,
      reason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
