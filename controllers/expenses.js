const { Expense, Purchase } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Obtener todos los gastos
 */
exports.getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, minAmount, maxAmount, includePurchase } = req.query;
    
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
    
    if (includePurchase === 'true') {
      options.include = {
        model: Purchase,
        as: 'purchase',
        attributes: ['id', 'date', 'total']
      };
    }
    
    const expenses = await Expense.findAll(options);
    
    // Calcular totales
    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    res.json({
      count: expenses.length,
      totalAmount,
      expenses
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener los gastos',
      details: error.message 
    });
  }
};

/**
 * Obtener un gasto por ID
 */
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includePurchase } = req.query;
    
    const options = {
      where: { id }
    };
    
    if (includePurchase === 'true') {
      options.include = {
        model: Purchase,
        as: 'purchase',
        attributes: ['id', 'date', 'total']
      };
    }
    
    const expense = await Expense.findOne(options);
    
    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener el gasto',
      details: error.message 
    });
  }
};

/**
 * Crear un nuevo gasto
 */
exports.createExpense = async (req, res) => {
  try {
    const { date, description, amount, category, purchase_id } = req.body;
    
    // Validación básica
    if (!date || !description || !amount || !category) {
      return res.status(400).json({ error: 'Fecha, descripción, monto y categoría son requeridos' });
    }
    
    // Verificar purchase_id si se proporciona
    if (purchase_id) {
      const purchase = await Purchase.findByPk(purchase_id);
      if (!purchase) {
        return res.status(400).json({ error: 'Compra asociada no encontrada' });
      }
    }
    
    const newExpense = await Expense.create({
      id: require('crypto').randomUUID(),
      date,
      description,
      amount,
      category,
      purchase_id: purchase_id || null
    });
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear el gasto',
      details: error.message 
    });
  }
};

/**
 * Actualizar un gasto
 */
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, category, purchase_id } = req.body;
    
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    
    // Verificar purchase_id si se proporciona
    if (purchase_id) {
      const purchase = await Purchase.findByPk(purchase_id);
      if (!purchase) {
        return res.status(400).json({ error: 'Compra asociada no encontrada' });
      }
    }
    
    const updatedExpense = await expense.update({
      date: date || expense.date,
      description: description || expense.description,
      amount: amount || expense.amount,
      category: category || expense.category,
      purchase_id: purchase_id !== undefined ? purchase_id : expense.purchase_id
    });
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar el gasto',
      details: error.message 
    });
  }
};

/**
 * Eliminar un gasto
 */
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Expense.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    
    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar el gasto',
      details: error.message 
    });
  }
};

/**
 * Obtener estadísticas de gastos
 */
exports.getExpensesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    
    // Estadísticas por categoría
    const statsByCategory = await Expense.findAll({
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
    const monthlyStats = await Expense.findAll({
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
      error: 'Error al obtener estadísticas de gastos',
      details: error.message 
    });
  }
};