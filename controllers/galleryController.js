// Gallery controller
const db = require('../config/db');

async function getGallery(req, res) {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM gallery ORDER BY created_at DESC';
    const params = [];
    if (category && category !== 'all') {
      query = 'SELECT * FROM gallery WHERE category = ? ORDER BY created_at DESC';
      params.push(category);
    }
    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, gallery: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addGalleryItem(req, res) {
  try {
    const { title, description, image, category } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    const [result] = await db.query(
      'INSERT INTO gallery (title, description, image, category) VALUES (?, ?, ?, ?)',
      [title, description || '', image || '', category || 'sweets']
    );
    res.status(201).json({ success: true, message: 'Gallery item added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteGalleryItem(req, res) {
  try {
    const [result] = await db.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    res.json({ success: true, message: 'Gallery item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getGallery, addGalleryItem, deleteGalleryItem };
