const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');
const Supplier = require('./Supplier');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: require('crypto').randomUUID()
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del producto es requerido'
      },
      len: {
        args: [2, 255],
        msg: 'El nombre debe tener entre 2 y 255 caracteres'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'La descripción no puede exceder los 2000 caracteres'
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
        args: [0],
        msg: 'El precio no puede ser negativo'
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
        args: [0],
        msg: 'El costo no puede ser negativo'
      }
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'El stock debe ser un número entero'
      },
      min: {
        args: [0],
        msg: 'El stock no puede ser negativo'
      }
    }
  },
  min_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'El stock mínimo debe ser un número entero'
      },
      min: {
        args: [0],
        msg: 'El stock mínimo no puede ser negativo'
      }
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Este SKU ya está en uso'
    },
    validate: {
      notEmpty: {
        msg: 'El SKU es requerido'
      }
    }
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: {
      msg: 'Este código de barras ya está en uso'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  image: {
    type: DataTypes.STRING(500),
    validate: {
      isUrl: {
        msg: 'La imagen debe ser una URL válida'
      }
    }
  },
  category_id: {
    type: DataTypes.STRING(36),
    references: {
      model: Category,
      key: 'id'
    }
  },
  supplier_id: {
    type: DataTypes.STRING(36),
    references: {
      model: Supplier,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'products',
  indexes: [
    {
      unique: true,
      fields: ['sku']
    },
    {
      unique: true,
      fields: ['barcode']
    },
    {
      fields: ['name']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['supplier_id']
    }
  ]
});

// Relación con Categoría
Product.belongsTo(Category, { 
  foreignKey: 'category_id',
  as: 'category',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Relación con Proveedor
Product.belongsTo(Supplier, { 
  foreignKey: 'supplier_id',
  as: 'supplier',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Métodos personalizados del modelo
Product.prototype.isBelowMinStock = function() {
  return this.stock < this.min_stock;
};

Product.prototype.getProfit = function() {
  return this.price - this.cost;
};

Product.prototype.getProfitPercentage = function() {
  return ((this.getProfit() / this.cost) * 100).toFixed(2);
};

// Hooks (ganchos) del modelo
Product.beforeValidate((product, options) => {
  if (product.name) {
    product.name = product.name.trim();
  }
  
  if (product.sku) {
    product.sku = product.sku.toUpperCase().trim();
  }
});

Product.beforeCreate(async (product, options) => {
  if (!product.sku) {
    // Generar SKU automático si no se proporciona
    const prefix = product.name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    product.sku = `${prefix}-${randomNum}`;
  }
});

module.exports = Product;