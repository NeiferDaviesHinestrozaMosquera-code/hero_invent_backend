const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Sale = require('./Sale');

const Income = sequelize.define('Income', {
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
        msg: 'La categoría del ingreso es requerida'
      },
      isIn: {
        args: [['Ventas', 'Servicios', 'Reembolsos', 'Otros']],
        msg: 'Categoría de ingreso no válida'
      }
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'income',
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['category']
    },
    {
      fields: ['sale_id']
    }
  ]
});

// Relación con Sale (opcional)
Income.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Hooks para manejo de datos
Income.beforeValidate((income, options) => {
  if (income.description) {
    income.description = income.description.trim();
  }
  
  if (income.category) {
    income.category = income.category.charAt(0).toUpperCase() + income.category.slice(1).toLowerCase();
  }
});

module.exports = Income;