const { Sale, SaleItem, Product, Income } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Obtener todas las ventas
 */
exports.getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, status, customer, minTotal, maxTotal } = req.query;
    
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
    
    // Filtro por cliente
    if (customer) {
      where.customer = { [Op.like]: `%${customer}%` };
    }
    
    // Filtros por total
    if (minTotal || maxTotal) {
      where.total = {};
      if (minTotal) where.total[Op.gte] = parseFloat(minTotal);
      if (maxTotal) where.total[Op.lte] = parseFloat(maxTotal);
    }
    
    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: SaleItem,
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
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las ventas',
      details: error.message 
    });
  }
};

/**
 * Obtener una venta por ID
 */
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'price', 'stock']
          }]
        },
        {
          model: Income,
          as: 'income',
          attributes: ['id', 'date', 'amount', 'description']
        }
      ]
    });
    
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener la venta',
      details: error.message 
    });
  }
};

/**
 * Crear una nueva venta con sus items
 */
exports.createSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { date, customer, items, status = 'pending' } = req.body;
    
    // Validación básica
    if (!date || !customer || !items || !items.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Fecha, cliente y items son requeridos' });
    }
    
    // Verificar stock disponible para cada producto
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(400).json({ error: `Producto con ID ${item.product_id} no encontrado` });
      }
      
      if (status === 'completed' && product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: `Stock insuficiente para el producto ${product.name} (Stock actual: ${product.stock})`
        });
      }
    }
    
    // Crear la venta
    const sale = await Sale.create({
      id: require('crypto').randomUUID(),
      date,
      customer,
      status,
      total: 0 // Se actualizará con el hook
    }, { transaction });
    
    // Crear los items de venta
    const saleItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction });
      
      const saleItem = await SaleItem.create({
        id: require('crypto').randomUUID(),
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price || product.price // Usar precio proporcionado o precio del producto
      }, { transaction });
      
      saleItems.push(saleItem);
      
      // Si la venta está completada, reducir el stock
      if (status === 'completed') {
        await product.decrement('stock', { by: item.quantity, transaction });
      }
    }
    
    // Recalcular el total de la venta
    const total = saleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    await sale.update({ total }, { transaction });
    
    // Si la venta está completada, crear el ingreso asociado
    if (status === 'completed') {
      await Income.create({
        id: require('crypto').randomUUID(),
        date,
        description: `Venta #${sale.id} a ${customer}`,
        amount: total,
        category: 'Ventas',
        sale_id: sale.id
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener la venta con todos sus datos para la respuesta
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items', include: ['product'] }
      ]
    });
    
    res.status(201).json(createdSale);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al crear la venta',
      details: error.message 
    });
  }
};

/**
 * Actualizar una venta (principalmente su estado)
 */
exports.updateSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, date, customer } = req.body;
    
    const sale = await Sale.findByPk(id, {
      include: [
        { model: SaleItem, as: 'items', include: ['product'] },
        { model: Income, as: 'income' }
      ],
      transaction
    });
    
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    // Validar cambio de estado
    if (status === 'completed' && sale.status !== 'completed') {
      // Verificar stock antes de completar
      for (const item of sale.items) {
        if (item.product.stock < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: `Stock insuficiente para el producto ${item.product.name} (Stock actual: ${item.product.stock})`
          });
        }
      }
    }
    
    // Actualizar campos básicos
    const updates = {};
    if (date) updates.date = date;
    if (customer) updates.customer = customer;
    if (status) updates.status = status;
    
    await sale.update(updates, { transaction });
    
    // Si el estado cambió a 'completed', actualizar stock y crear ingreso si no existe
    if (status === 'completed' && sale.status !== 'completed') {
      for (const item of sale.items) {
        await item.product.decrement('stock', { by: item.quantity, transaction });
      }
      
      if (!sale.income) {
        await Income.create({
          id: require('crypto').randomUUID(),
          date: sale.date,
          description: `Venta #${sale.id} a ${sale.customer}`,
          amount: sale.total,
          category: 'Ventas',
          sale_id: sale.id
        }, { transaction });
      }
    }
    
    // Si el estado cambió a 'cancelled' y antes estaba 'completed', revertir stock
    if (status === 'cancelled' && sale.status === 'completed') {
      for (const item of sale.items) {
        await item.product.increment('stock', { by: item.quantity, transaction });
      }
      
      // Eliminar el ingreso asociado si existe
      if (sale.income) {
        await sale.income.destroy({ transaction });
      }
    }
    
    await transaction.commit();
    
    const updatedSale = await Sale.findByPk(id, {
      include: [
        { model: SaleItem, as: 'items', include: ['product'] }
      ]
    });
    
    res.json(updatedSale);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al actualizar la venta',
      details: error.message 
    });
  }
};

/**
 * Eliminar una venta (solo si está pendiente o cancelada)
 */
exports.deleteSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const sale = await Sale.findByPk(id, { 
      include: ['income'],
      transaction 
    });
    
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    if (sale.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'No se pueden eliminar ventas completadas. Cancele primero la venta.' 
      });
    }
    
    // Eliminar items primero (por la relación CASCADE)
    await SaleItem.destroy({ 
      where: { sale_id: id },
      transaction 
    });
    
    // Eliminar ingreso asociado si existe
    if (sale.income) {
      await sale.income.destroy({ transaction });
    }
    
    await sale.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: 'Error al eliminar la venta',
      details: error.message 
    });
  }
};

/**
 * Obtener estadísticas de ventas
 */
exports.getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      status: 'completed' // Solo ventas completadas para estadísticas
    };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    // Estadísticas por cliente
    const statsByCustomer = await Sale.findAll({
      where,
      attributes: [
        'customer',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
      ],
      group: ['customer'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total')), 'DESC']],
      limit: 10
    });
    
    // Estadísticas mensuales
    const monthlyStats = await Sale.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });
    
    // Productos más vendidos
    const topProducts = await SaleItem.findAll({
      include: [{
        model: Sale,
        as: 'sale',
        where: { status: 'completed' },
        attributes: []
      }, {
        model: Product,
        as: 'product',
        attributes: ['name']
      }],
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * price')), 'totalRevenue']
      ],
      group: ['product_id'],
      order: [[Sequelize.literal('totalQuantity'), 'DESC']],
      limit: 5
    });
    
    res.json({
      statsByCustomer,
      monthlyStats,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de ventas',
      details: error.message 
    });
  }
};