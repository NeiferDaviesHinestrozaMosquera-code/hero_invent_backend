const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Purchase = require('./Purchase');
const Product = require('./Product');

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: require('crypto').randomUUID()
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'La cantidad debe ser un número entero'
      },
      min: {
        args: [1],
        msg: 'La cantidad debe ser al menos 1'
      }
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El costo debe ser un número decimal'
      },
      min: {
        args: [0.01],
        msg: 'El costo debe ser mayor a 0'
      }
    }
  },
  subtotal: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.quantity * this.cost;
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'purchase_items'
});

// Relación con Compra
PurchaseItem.belongsTo(Purchase, {
  foreignKey: 'purchase_id',
  as: 'purchase',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Relación con Producto
PurchaseItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Hook para actualizar el stock del producto cuando se recibe una compra
PurchaseItem.afterSave(async (item, options) => {
  if (item.purchase && item.purchase.status === 'received' && item.product) {
    await item.product.increment('stock', { by: item.quantity });
  }
});

module.exports = PurchaseItem;