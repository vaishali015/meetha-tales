// Product controller - CRUD operations for products
const db = require('../config/db');
const { authAdmin } = require('../middleware/auth');

// GET /api/products - List all products (with optional category filter and search)
async function getProducts(req, res) {
  try {
    const { category, search, status } = req.query;
    let query = `SELECT p.*, c.name AS category_name FROM products p
                  LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND c.name = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND p.name LIKE ?';
      params.push('%' + search + '%');
    }
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    query += ' ORDER BY p.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, products: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/products/:id - Get single product
async function getProduct(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/products - Create product (admin only)
async function createProduct(req, res) {
  try {
    const { name, category_id, description, price, quantity, unit, image, rating, status } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }
    const [result] = await db.query(
      `INSERT INTO products (name, category_id, description, price, quantity, unit, image, rating, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id || null, description || '', price, quantity || 0, unit || 'kg', image || '', rating || 4.5, status || 'active']
    );

    // Create inventory record with default min_stock
    await db.query('INSERT INTO inventory (product_id, min_stock) VALUES (?, ?)', [result.insertId, 5]);

    res.status(201).json({ success: true, message: 'Product added successfully.', product_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/products/:id - Update product (admin only)
async function updateProduct(req, res) {
  try {
    const { name, category_id, description, price, quantity, unit, image, rating, status } = req.body;
    const [result] = await db.query(
      `UPDATE products SET name=?, category_id=?, description=?, price=?, quantity=?, unit=?, image=?, rating=?, status=? WHERE id=?`,
      [name, category_id || null, description || '', price, quantity, unit || 'kg', image || '', rating || 4.5, status || 'active', req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/products/:id - Delete product (admin only)
async function deleteProduct(req, res) {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
