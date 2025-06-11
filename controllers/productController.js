const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
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

exports.getProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const products = await Product.getByCategory(category_id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductsBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    const products = await Product.getBySupplier(supplier_id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const products = await Product.search(searchTerm);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.getLowStock(threshold);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({
        error: 'Name and price are required',
        details: 'Provide at least product name and price'
      });
    }

    // Validar que el precio sea válido
    const price = parseFloat(req.body.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        error: 'Invalid price',
        details: 'Price must be a valid number >= 0'
      });
    }

    // Validar costo si se proporciona
    let cost = null;
    if (req.body.cost !== undefined && req.body.cost !== null) {
      cost = parseFloat(req.body.cost);
      if (isNaN(cost) || cost < 0) {
        return res.status(400).json({
          error: 'Invalid cost',
          details: 'Cost must be a valid number >= 0'
        });
      }
    }

    // Validar cantidad si se proporciona
    let stock = 0;
    if (req.body.stock !== undefined && req.body.stock !== null) {
      stock = parseInt(req.body.stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({
          error: 'Invalid stock',
          details: 'Quantity must be a valid integer >= 0'
        });
      }
    }

    // Verificar si el SKU ya existe (si se proporciona)
    if (req.body.sku) {
      const skuExists = await Product.skuExists(req.body.sku);
      if (skuExists) {
        return res.status(400).json({
          error: 'SKU already exists',
          details: 'Please use a different SKU'
        });
      }
    }

      // Validar min_stock si se proporciona
    let min_stock = 0;
    if (req.body.min_stock !== undefined && req.body.min_stock !== null) {
      min_stock = parseInt(req.body.min_stock);
      if (isNaN(min_stock) || min_stock < 0) {
        return res.status(400).json({
          error: 'Invalid min_stock',
          details: 'min_stock must be a valid integer >= 0'
        });
      }
    }

    const newProduct = {
      name: req.body.name,
      description: req.body.description || null,
      price: price,
      cost: cost,
      stock: stock,
      min_stock: min_stock,
      category_id: req.body.category_id || null,
      supplier_id: req.body.supplier_id || null,
      sku: req.body.sku || null,
      barcode: req.body.barcode || null,
      status: req.body.status || 'active',
      image: req.body.image || null,
    };

    const result = await Product.create(newProduct);

    res.status(201).json({
      id: result.insertId,
      message: 'Product created successfully',
      product: { id: result.insertId, ...newProduct }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await Product.getById(id);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validar precio si se proporciona
    let price = existingProduct.price;
    if (req.body.price !== undefined) {
      price = parseFloat(req.body.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          error: 'Invalid price',
          details: 'Price must be a valid number >= 0'
        });
      }
    }

    // Validar costo si se proporciona
    let cost = existingProduct.cost;
    if (req.body.cost !== undefined) {
      cost = req.body.cost === null ? null : parseFloat(req.body.cost);
      if (cost !== null && (isNaN(cost) || cost < 0)) {
        return res.status(400).json({
          error: 'Invalid cost',
          details: 'Cost must be a valid number >= 0'
        });
      }
    }

    // Validar cantidad si se proporciona
    let stock = existingProduct.stock;
    if (req.body.stock !== undefined) {
      stock = parseInt(req.body.stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({
          error: 'Invalid stock',
          details: 'Quantity must be a valid integer >= 0'
        });
      }
    }

    // Verificar si el SKU ya existe (si se cambia)
    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const skuExists = await Product.skuExists(req.body.sku, id);
      if (skuExists) {
        return res.status(400).json({
          error: 'SKU already exists',
          details: 'Please use a different SKU'
        });
      }
    }

    const updatedProduct = {
      name: req.body.name || existingProduct.name,
      description: req.body.description !== undefined ? req.body.description : existingProduct.description,
      price: price,
      cost: cost,
      stock: stock,
      min_stock: req.body.min_stock,
      category_id: req.body.category_id !== undefined ? req.body.category_id : existingProduct.category_id,
      supplier_id: req.body.supplier_id !== undefined ? req.body.supplier_id : existingProduct.supplier_id,
      sku: req.body.sku !== undefined ? req.body.sku : existingProduct.sku,
      barcode: req.body.barcode !== undefined ? req.body.barcode : existingProduct.barcode,
      status: req.body.status || existingProduct.status,
      image: req.body.image !== undefined ? req.body.image : existingProduct.image,
    };

    const result = await Product.update(id, updatedProduct);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or no changes made' });
    }

    res.json({
      id,
      message: 'Product updated successfully',
      product: { id, ...updatedProduct }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const qty = parseInt(stock);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        error: 'Invalid stock',
        details: 'Quantity must be a valid integer >= 0'
      });
    }

    const result = await Product.updateStock(id, qty);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id,
      message: 'Product stock updated successfully',
      stock: qty
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Price is required' });
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      return res.status(400).json({
        error: 'Invalid price',
        details: 'Price must be a valid number >= 0'
      });
    }

    const result = await Product.updatePrice(id, priceValue);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id,
      message: 'Product price updated successfully',
      price: priceValue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProductCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { cost } = req.body;

    if (cost === undefined || cost === null) {
      return res.status(400).json({ error: 'Cost is required' });
    }

    const costValue = parseFloat(cost);
    if (isNaN(costValue) || costValue < 0) {
      return res.status(400).json({
        error: 'Invalid cost',
        details: 'Cost must be a valid number >= 0'
      });
    }

    const result = await Product.updateCost(id, costValue);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id,
      message: 'Product cost updated successfully',
      cost: costValue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['active', 'inactive', 'deleted', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: `Valid statuses are: ${validStatuses.join(', ')}`
      });
    }

    const result = await Product.updateStatus(id, status);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id,
      message: 'Product status updated successfully',
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const product = await Product.getById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Eliminar permanentemente si se especifica
    if (permanent === 'true') {
      const result = await Product.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({
        id,
        message: 'Product deleted permanently'
      });
    } else {
      // Soft delete por defecto
      const result = await Product.softDelete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({
        id,
        message: 'Product deactivated successfully (soft delete)',
        note: 'Use ?permanent=true to delete permanently'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
