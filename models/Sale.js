const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Income = require('./Income');

const Sale = sequelize.define('Sale', {
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
  customer: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El cliente es requerido'
      },
      len: {
        args: [2, 255],
        msg: 'El nombre del cliente debe tener entre 2 y 255 caracteres'
      }
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El total debe ser un número decimal'
      },
      min: {
        args: [0.01],
        msg: 'El total debe ser mayor a 0'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'completed', 'cancelled']],
        msg: 'Estado no válido'
      }
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'sales',
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['customer']
    }
  ]
});

// Relación con Items de Venta (uno a muchos)
Sale.hasMany(SaleItem, {
  foreignKey: 'sale_id',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Relación con Ingresos (uno a uno opcional)
Sale.hasOne(Income, {
  foreignKey: 'sale_id',
  as: 'income',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Hook para actualizar el total antes de guardar
Sale.beforeSave(async (sale, options) => {
  if (sale.items) {
    const total = sale.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    sale.total = total;
  }
});

module.exports = Sale;