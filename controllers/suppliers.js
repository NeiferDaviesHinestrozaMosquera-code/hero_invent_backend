const { Supplier, Product, Purchase } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los proveedores
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const { includeProducts, includePurchases, search } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contact: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const options = {
      where,
      order: [['name', 'ASC']]
    };
    
    if (includeProducts === 'true') {
      options.include = {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'stock'],
        required: false
      };
    }
    
    if (includePurchases === 'true') {
      options.include = options.include || [];
      options.include.push({
        model: Purchase,
        as: 'purchases',
        attributes: ['id', 'date', 'total', 'status'],
        required: false
      });
    }
    
    const suppliers = await Supplier.findAll(options);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener los proveedores',
      details: error.message 
    });
  }
};

/**
 * Obtener un proveedor por ID
 */
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeProducts, includePurchases } = req.query;
    
    const options = {
      where: { id }
    };
    
    if (includeProducts === 'true') {
      options.include = {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'stock'],
        required: false
      };
    }
    
    if (includePurchases === 'true') {
      options.include = options.include || [];
      options.include.push({
        model: Purchase,
        as: 'purchases',
        attributes: ['id', 'date', 'total', 'status'],
        required: false
      });
    }
    
    const supplier = await Supplier.findOne(options);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener el proveedor',
      details: error.message 
    });
  }
};

/**
 * Crear un nuevo proveedor
 */
exports.createSupplier = async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;
    
    // Validación básica
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const newSupplier = await Supplier.create({
      id: require('crypto').randomUUID(),
      name,
      contact,
      email,
      phone,
      address
    });
    
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear el proveedor',
      details: error.message 
    });
  }
};

/**
 * Actualizar un proveedor
 */
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, phone, address } = req.body;
    
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    // Si se está cambiando el email, verificar que no exista otro con el mismo email
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ where: { email } });
      if (existingSupplier) {
        return res.status(400).json({ error: 'Ya existe un proveedor con este email' });
      }
    }
    
    const updatedSupplier = await supplier.update({
      name: name || supplier.name,
      contact: contact !== undefined ? contact : supplier.contact,
      email: email !== undefined ? email : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      address: address !== undefined ? address : supplier.address
    });
    
    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar el proveedor',
      details: error.message 
    });
  }
};

/**
 * Eliminar un proveedor
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor tiene productos asociados
    const productsCount = await Product.count({ where: { supplier_id: id } });
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el proveedor porque tiene productos asociados',
        productsCount
      });
    }
    
    // Verificar si el proveedor tiene compras asociadas
    const purchasesCount = await Purchase.count({ where: { supplier_id: id } });
    if (purchasesCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el proveedor porque tiene compras asociadas',
        purchasesCount
      });
    }
    
    const deleted = await Supplier.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar el proveedor',
      details: error.message 
    });
  }
};

/**
 * Buscar proveedores
 */
exports.searchSuppliers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }
    
    const suppliers = await Supplier.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { contact: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
    
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al buscar proveedores',
      details: error.message 
    });
  }
};