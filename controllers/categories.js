const { Category, Product } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todas las categorías
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { includeProducts } = req.query;
    
    const options = {
      order: [['name', 'ASC']]
    };

    if (includeProducts === 'true') {
      options.include = {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'stock']
      };
    }

    const categories = await Category.findAll(options);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las categorías',
      details: error.message 
    });
  }
};

/**
 * Obtener una categoría por ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeProducts } = req.query;
    
    const options = {
      where: { id }
    };

    if (includeProducts === 'true') {
      options.include = {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'stock']
      };
    }

    const category = await Category.findOne(options);

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener la categoría',
      details: error.message 
    });
  }
};

/**
 * Crear una nueva categoría
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Verificar si la categoría ya existe
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
    }

    const newCategory = await Category.create({
      id: require('crypto').randomUUID(),
      name,
      description
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear la categoría',
      details: error.message 
    });
  }
};

/**
 * Actualizar una categoría
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Si se está cambiando el nombre, verificar que no exista otra con el mismo nombre
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
      }
    }

    const updatedCategory = await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar la categoría',
      details: error.message 
    });
  }
};

/**
 * Eliminar una categoría
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la categoría tiene productos asociados
    const productsCount = await Product.count({ where: { category_id: id } });
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene productos asociados',
        productsCount
      });
    }

    const deleted = await Category.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar la categoría',
      details: error.message 
    });
  }
};

/**
 * Buscar categorías por nombre
 */
exports.searchCategories = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    const categories = await Category.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`
        }
      },
      order: [['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al buscar categorías',
      details: error.message 
    });
  }
};