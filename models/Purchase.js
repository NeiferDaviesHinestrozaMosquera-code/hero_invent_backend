const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Supplier = require('./Supplier');
const Expense = require('./Expense');

const Purchase = sequelize.define('Purchase', {
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
    type: DataTypes.ENUM('pending', 'received', 'cancelled'),
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'received', 'cancelled']],
        msg: 'Estado no válido'
      }
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'purchases',
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['supplier_id']
    }
  ]
});

// Relación con Proveedor
Purchase.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Relación con Items de Compra (uno a muchos)
Purchase.hasMany(PurchaseItem, {
  foreignKey: 'purchase_id',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Relación con Gastos (uno a uno opcional)
Purchase.hasOne(Expense, {
  foreignKey: 'purchase_id',
  as: 'expense',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Hook para actualizar el total antes de guardar
Purchase.beforeSave(async (purchase, options) => {
  if (purchase.items) {
    const total = purchase.items.reduce((sum, item) => {
      return sum + (item.quantity * item.cost);
    }, 0);
    purchase.total = total;
  }
});

module.exports = Purchase;