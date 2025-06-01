const { Income, Sale } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Obtener todos los ingresos
 */
exports.getAllIncome = async (req, res) => {
  try {
    const { startDate, endDate, category, minAmount, maxAmount, includeSale } = req.query;
    
    const where = {};
    
    // Filtros de fecha
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    // Filtro por categoría
    if (category) {
      where.category = category;
    }
    
    // Filtros por monto
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }
    
    const options = {
      where,
      order: [['date', 'DESC']]
    };
    
    if (includeSale === 'true') {
      options.include = {
        model: Sale,
        as: 'sale',
        attributes: ['id', 'date', 'total', 'customer']
      };
    }
    
    const income = await Income.findAll(options);
    
    // Calcular totales
    const totalAmount = income.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    
    res.json({
      count: income.length,
      totalAmount,
      income
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener los ingresos',
      details: error.message 
    });
  }
};

/**
 * Obtener un ingreso por ID
 */
exports.getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeSale } = req.query;
    
    const options = {
      where: { id }
    };
    
    if (includeSale === 'true') {
      options.include = {
        model: Sale,
        as: 'sale',
        attributes: ['id', 'date', 'total', 'customer']
      };
    }
    
    const incomeEntry = await Income.findOne(options);
    
    if (!incomeEntry) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }
    
    res.json(incomeEntry);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener el ingreso',
      details: error.message 
    });
  }
};

/**
 * Crear un nuevo ingreso
 */
exports.createIncome = async (req, res) => {
  try {
    const { date, description, amount, category, sale_id } = req.body;
    
    // Validación básica
    if (!date || !description || !amount || !category) {
      return res.status(400).json({ error: 'Fecha, descripción, monto y categoría son requeridos' });
    }
    
    // Verificar sale_id si se proporciona
    if (sale_id) {
      const sale = await Sale.findByPk(sale_id);
      if (!sale) {
        return res.status(400).json({ error: 'Venta asociada no encontrada' });
      }
    }
    
    const newIncome = await Income.create({
      id: require('crypto').randomUUID(),
      date,
      description,
      amount,
      category,
      sale_id: sale_id || null
    });
    
    res.status(201).json(newIncome);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear el ingreso',
      details: error.message 
    });
  }
};

/**
 * Actualizar un ingreso
 */
exports.updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, category, sale_id } = req.body;
    
    const incomeEntry = await Income.findByPk(id);
    if (!incomeEntry) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }
    
    // Verificar sale_id si se proporciona
    if (sale_id) {
      const sale = await Sale.findByPk(sale_id);
      if (!sale) {
        return res.status(400).json({ error: 'Venta asociada no encontrada' });
      }
    }
    
    const updatedIncome = await incomeEntry.update({
      date: date || incomeEntry.date,
      description: description || incomeEntry.description,
      amount: amount || incomeEntry.amount,
      category: category || incomeEntry.category,
      sale_id: sale_id !== undefined ? sale_id : incomeEntry.sale_id
    });
    
    res.json(updatedIncome);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar el ingreso',
      details: error.message 
    });
  }
};

/**
 * Eliminar un ingreso
 */
exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Income.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }
    
    res.json({ message: 'Ingreso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar el ingreso',
      details: error.message 
    });
  }
};

/**
 * Obtener estadísticas de ingresos
 */
exports.getIncomeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    // Estadísticas por categoría
    const statsByCategory = await Income.findAll({
      where,
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      group: ['category'],
      order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']]
    });
    
    // Estadísticas mensuales
    const monthlyStats = await Income.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });
    
    res.json({
      statsByCategory,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de ingresos',
      details: error.message 
    });
  }
};