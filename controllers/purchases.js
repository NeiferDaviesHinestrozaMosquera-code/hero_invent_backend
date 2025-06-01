const { Purchase, PurchaseItem, Product, Supplier, Expense } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Obtener todas las compras
 */
exports.getAllPurchases = async (req, res) => {
  try {
    const { startDate, endDate, status, supplierId, minTotal, maxTotal } = req.query;
    
    const where = {};
    
    // Filtros de fecha
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    // Filtro por estado
    if (status) {
      where.status = status;
    }
    
    // Filtro por proveedor
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    // Filtros por total
    if (minTotal || maxTotal) {
      where.total = {};
      if (minTotal) where.total[Op.gte] = parseFloat(minTotal);
      if (maxTotal) where.total[Op.lte] = parseFloat(maxTotal);
    }
    
    const purchases = await Purchase.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }]
        }
      ],
      order: [['date', 'DESC']]
    });
    
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las compras',
      details: error.message 
    });
  }
};

/**
 * Obtener una compra por ID
 */
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchase = await Purchase.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact', 'email', 'phone']
        },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'price', 'stock']
          }]
        },
        {
          model: Expense,
          as: 'expense',
          attributes: ['id', 'date', 'amount', 'description']
        }
      ]
    });
    
    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener la compra',
      details: error.message 
    });
  }
};

/**
 * Crear una nueva compra con sus items
 */
exports.createPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { date, supplier_id, items, status = 'pending' } = req.body;
    
    // Validación básica
    if (!date || !supplier_id || !items || !items.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Fecha, proveedor y items son requeridos' });
    }
    
    // Verificar que el proveedor existe
    const supplier = await Supplier.findByPk(supplier_id, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Proveedor no encontrado' });
    }
    
    // Crear la compra
    const purchase = await Purchase.create({
      id: require('crypto').randomUUID(),
      date,
      supplier_id,
      status,
      total: 0 // Se actualizará con el hook
    }, { transaction });
    
    // Crear los items de compra
    const purchaseItems = [];
    for (const item of items) {
      // Verificar que el producto existe
      const product = await Product.findByPk(item.product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(400).json({ error: `Producto con ID ${item.product_id} no encontrado` });
      }
      
      const purchaseItem = await PurchaseItem.create({
        id: require('crypto').randomUUID(),
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        cost: item.cost
      }, { transaction });
      
      purchaseItems.push(purchaseItem);
    }
    
    // Recalcular el total de la compra
    const total = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    await purchase.update({ total }, { transaction });
    
    // Si la compra está recibida, actualizar el stock
    if (status === 'received') {
      for (const item of purchaseItems) {
        await Product.increment('stock', {
          by: item.quantity,
          where: { id: item.product_id },
          transaction
        });
      }
      
      // Crear el gasto asociado
      await Expense.create({
        id: require('crypto').randomUUID(),
        date,
        description: `Compra de inventario #${purchase.id}`,
        amount: total,
        category: 'Inventario',
        purchase_id: purchase.id
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener la compra con todos sus datos para la respuesta
    const createdPurchase = await Purchase.findByPk(purchase.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseItem, as: 'items', include: ['product'] }
      ]
    });
    
    res.status(201).json(createdPurchase);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al crear la compra',
      details: error.message 
    });
  }
};

/**
 * Actualizar una compra (principalmente su estado)
 */
exports.updatePurchase = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, date } = req.body;
    
    const purchase = await Purchase.findByPk(id, {
      include: [
        { model: PurchaseItem, as: 'items' },
        { model: Expense, as: 'expense' }
      ],
      transaction
    });
    
    if (!purchase) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    // Actualizar campos básicos
    const updates = {};
    if (date) updates.date = date;
    if (status) updates.status = status;
    
    await purchase.update(updates, { transaction });
    
    // Si el estado cambió a 'received', actualizar stock y crear gasto si no existe
    if (status === 'received' && purchase.status !== 'received') {
      for (const item of purchase.items) {
        await Product.increment('stock', {
          by: item.quantity,
          where: { id: item.product_id },
          transaction
        });
      }
      
      if (!purchase.expense) {
        await Expense.create({
          id: require('crypto').randomUUID(),
          date: purchase.date,
          description: `Compra de inventario #${purchase.id}`,
          amount: purchase.total,
          category: 'Inventario',
          purchase_id: purchase.id
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    const updatedPurchase = await Purchase.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseItem, as: 'items', include: ['product'] }
      ]
    });
    
    res.json(updatedPurchase);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al actualizar la compra',
      details: error.message 
    });
  }
};

/**
 * Eliminar una compra (solo si está pendiente)
 */
exports.deletePurchase = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const purchase = await Purchase.findByPk(id, { transaction });
    
    if (!purchase) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    if (purchase.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Solo se pueden eliminar compras con estado pendiente' 
      });
    }
    
    // Eliminar items primero (por la relación CASCADE)
    await PurchaseItem.destroy({ 
      where: { purchase_id: id },
      transaction 
    });
    
    await purchase.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Compra eliminada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al eliminar la compra',
      details: error.message 
    });
  }
};

/**
 * Obtener estadísticas de compras
 */
exports.getPurchaseStats = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    
    const where = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    // Estadísticas por proveedor
    const statsBySupplier = await Purchase.findAll({
      where,
      attributes: [
        'supplier_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
      ],
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['name']
      }],
      group: ['supplier_id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total')), 'DESC']]
    });
    
    // Estadísticas mensuales
    const monthlyStats = await Purchase.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });
    
    res.json({
      statsBySupplier,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de compras',
      details: error.message 
    });
  }
};