const Supplier = require('../models/Supplier');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');


exports.createSupplier = async (req, res) => {
  try {
    // Validación básica
    if (!req.body.name) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Verificar email único
    if (req.body.email) {
      const existingSupplier = await Supplier.findByEmail(req.body.email);
      if (existingSupplier) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }
    }

    const newSupplier = await Supplier.create(req.body);
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el proveedor" });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    // Verificar que existe
    const existingSupplier = await Supplier.findById(req.params.id);
    if (!existingSupplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    // Verificar email único si se cambia
    if (req.body.email && req.body.email !== existingSupplier.email) {
      const emailExists = await Supplier.findByEmail(req.body.email);
      if (emailExists) {
        return res.status(400).json({ error: "El nuevo email ya está registrado" });
      }
    }

    const updatedSupplier = await Supplier.update(req.params.id, req.body);
    res.json(updatedSupplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el proveedor" });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    // Verificar que existe
    const existingSupplier = await Supplier.findById(req.params.id);
    if (!existingSupplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    await Supplier.delete(req.params.id);
    res.json({ message: "Proveedor eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el proveedor" });
  }
};

// This function was not in the original supplierController but was referenced in allRoutes.js
// Adding a placeholder for it to avoid errors. You might need to implement its logic.
exports.getSupplierProducts = async (req, res) => {
  try {
    // Implement logic to get products by supplier ID
    res.status(501).json({ message: "Esta función aún no está implementada." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos del proveedor" });
  }
};
