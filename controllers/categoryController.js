// Category controller - CRUD for categories
const db = require('../config/db');

async function getCategories(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, count: rows.length, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description, image, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const [result] = await db.query(
      'INSERT INTO categories (name, description, image, status) VALUES (?, ?, ?, ?)',
      [name, description || '', image || '', status || 'active']
    );
    res.status(201).json({ success: true, message: 'Category added successfully.', category_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category name already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description, image, status } = req.body;
    const [result] = await db.query(
      'UPDATE categories SET name=?, description=?, image=?, status=? WHERE id=?',
      [name, description || '', image || '', status || 'active', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
