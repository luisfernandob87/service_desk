const { Category } = require('../models');

exports.list = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'parent' }],
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar categorías' });
  }
};

exports.getById = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id, {
      include: [{ model: Category, as: 'parent' }, { model: Category, as: 'children' }],
    });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

async function getDepth(categoryId) {
  let depth = 0;
  let current = await Category.findByPk(categoryId);
  while (current?.parent_id) {
    depth++;
    current = await Category.findByPk(current.parent_id);
  }
  return depth;
}

exports.create = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name requerido' });
    }
    if (parent_id) {
      const depth = await getDepth(parent_id);
      if (depth >= 2) {
        return res.status(400).json({ error: 'No se pueden crear más de 3 niveles de categorías' });
      }
    }
    const cat = await Category.create({ name, parent_id });
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

exports.update = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });

    const { name, parent_id, is_active } = req.body;
    if (name) cat.name = name;
    if (parent_id !== undefined) {
      if (parent_id) {
        const depth = await getDepth(parent_id);
        if (depth >= 2) {
          return res.status(400).json({ error: 'No se pueden crear más de 3 niveles de categorías' });
        }
      }
      cat.parent_id = parent_id;
    }
    if (is_active !== undefined) cat.is_active = is_active;
    await cat.save();

    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

exports.remove = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    await cat.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};
