const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Sale = require('./Sale');
const Product = require('./Product');

const SaleItem = sequelize.define('SaleItem', {
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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El precio debe ser un número decimal'
      },
      min: {
        args: [0.01],
        msg: 'El precio debe ser mayor a 0'
      }
    }
  },
  subtotal: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.quantity * this.price;
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'sale_items'
});

// Relación con Venta
SaleItem.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Relación con Producto
SaleItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Hook para actualizar el stock del producto cuando se completa una venta
SaleItem.afterSave(async (item, options) => {
  if (item.sale && item.sale.status === 'completed' && item.product) {
    await item.product.decrement('stock', { by: item.quantity });
  }
});

// Hook para revertir el stock si se cancela una venta
Sale.afterUpdate(async (sale, options) => {
  if (sale.status === 'cancelled' && sale.previous('status') === 'completed') {
    const items = await SaleItem.findAll({
      where: { sale_id: sale.id },
      include: ['product']
    });
    
    for (const item of items) {
      await item.product.increment('stock', { by: item.quantity });
    }
  }
});

module.exports = SaleItem;