const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Purchase = require('./Purchase');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: require('crypto').randomUUID()
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'La fecha debe ser una fecha válida'
      },
      notEmpty: {
        msg: 'La fecha es requerida'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La descripción es requerida'
      },
      len: {
        args: [5, 1000],
        msg: 'La descripción debe tener entre 5 y 1000 caracteres'
      }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El monto debe ser un número decimal'
      },
      min: {
        args: [0.01],
        msg: 'El monto debe ser mayor a 0'
      }
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La categoría del gasto es requerida'
      },
      isIn: {
        args: [['Inventario', 'Operación', 'Servicios', 'Mantenimiento', 'Otros']],
        msg: 'Categoría de gasto no válida'
      }
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'expenses',
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['category']
    },
    {
      fields: ['purchase_id']
    }
  ]
});

// Relación con Purchase (opcional)
Expense.belongsTo(Purchase, {
  foreignKey: 'purchase_id',
  as: 'purchase',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Hooks para manejo de datos
Expense.beforeValidate((expense, options) => {
  if (expense.description) {
    expense.description = expense.description.trim();
  }
  
  if (expense.category) {
    expense.category = expense.category.charAt(0).toUpperCase() + expense.category.slice(1).toLowerCase();
  }
});

module.exports = Expense;