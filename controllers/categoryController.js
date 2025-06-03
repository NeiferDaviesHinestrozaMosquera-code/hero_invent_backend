const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class CategoryController {
  // Obtener todas las categorías
  static async getAllCategories(req, res) {
    try {
      const includeProducts = req.query.includeProducts === 'true';
      
      let query = 'SELECT * FROM categories ORDER BY name';
      let categories = [];

      const [rows] = await db.query(query);
      categories = rows;

      if (includeProducts) {
        // Obtener productos para cada categoría
        for (let category of categories) {
          const [products] = await db.query(
            'SELECT * FROM products WHERE category_id = ? AND is_active = 1',
            [category.id]
          );
          category.products = products;
        }
      }

      res.json({
        success: true,
        data: categories,
        message: 'Categorías obtenidas exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Buscar categorías por nombre
  static async searchCategories(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro query es requerido'
        });
      }

      const [rows] = await db.query(
        'SELECT * FROM categories WHERE name LIKE ? OR description LIKE ? ORDER BY name',
        [`%${query}%`, `%${query}%`]
      );

      res.json({
        success: true,
        data: rows,
        message: 'Búsqueda completada exitosamente'
      });
    } catch (error) {
      console.error('Error al buscar categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener una categoría por ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const includeProducts = req.query.includeProducts === 'true';

      const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      let category = rows[0];

      if (includeProducts) {
        const [products] = await db.query(
          'SELECT * FROM products WHERE category_id = ? AND is_active = 1',
          [id]
        );
        category.products = products;
      }

      res.json({
        success: true,
        data: category,
        message: 'Categoría obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear una nueva categoría
  static async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
      }

      // Verificar si ya existe una categoría con el mismo nombre
      const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }

      const id = uuidv4();
      
      const [result] = await db.query(
        'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
        [id, name, description || null]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al crear la categoría'
        });
      }

      // Obtener la categoría creada
      const [newCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);

      res.status(201).json({
        success: true,
        data: newCategory[0],
        message: 'Categoría creada exitosamente'
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar una categoría
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
      }

      // Verificar si la categoría existe
      const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si ya existe otra categoría con el mismo nombre
      const [duplicated] = await db.query(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (duplicated.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre'
        });
      }

      const [result] = await db.query(
        'UPDATE categories SET name = ?, description = ? WHERE id = ?',
        [name, description || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar la categoría'
        });
      }

      // Obtener la categoría actualizada
      const [updatedCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);

      res.json({
        success: true,
        data: updatedCategory[0],
        message: 'Categoría actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar una categoría
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Verificar si la categoría existe
      const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si hay productos asociados a esta categoría
      const [products] = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
      
      if (products[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la categoría porque tiene productos asociados'
        });
      }

      const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al eliminar la categoría'
        });
      }

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = CategoryController;