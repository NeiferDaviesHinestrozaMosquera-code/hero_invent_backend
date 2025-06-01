const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');
const Purchase = require('./Purchase');

const Supplier = sequelize.define('Supplier', {
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
        msg: 'El nombre del proveedor es requerido'
      },
      len: {
        args: [2, 255],
        msg: 'El nombre debe tener entre 2 y 255 caracteres'
      }
    }
  },
  contact: {
    type: DataTypes.STRING(255),
    validate: {
      len: {
        args: [0, 255],
        msg: 'El contacto no puede exceder los 255 caracteres'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    unique: {
      msg: 'Este email ya está registrado'
    },
    validate: {
      isEmail: {
        msg: 'El email debe ser una dirección válida'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    validate: {
      len: {
        args: [0, 50],
        msg: 'El teléfono no puede exceder los 50 caracteres'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'La dirección no puede exceder los 1000 caracteres'
      }
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'suppliers',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['name']
    }
  ]
});

// Relación con Productos (un proveedor tiene muchos productos)
Supplier.hasMany(Product, {
  foreignKey: 'supplier_id',
  as: 'products'
});

// Relación con Compras (un proveedor tiene muchas compras)
Supplier.hasMany(Purchase, {
  foreignKey: 'supplier_id',
  as: 'purchases'
});

// Hooks para manejo de datos
Supplier.beforeValidate((supplier, options) => {
  if (supplier.name) {
    supplier.name = supplier.name.trim();
  }
  
  if (supplier.email) {
    supplier.email = supplier.email.toLowerCase().trim();
  }
});

module.exports = Supplier;