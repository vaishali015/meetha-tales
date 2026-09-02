// Inventory controller
const db = require('../config/db');

// GET /api/inventory - List all inventory with product info
async function getInventory(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT i.id, p.name AS product_name, p.quantity AS current_stock, i.min_stock,
              p.unit, p.status,
              CASE WHEN p.quantity = 0 THEN 'Out of Stock'
                   WHEN p.quantity <= i.min_stock THEN 'Low Stock'
                   ELSE 'In Stock' END AS stock_status
       FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY p.quantity ASC`
    );
    res.json({ success: true, count: rows.length, inventory: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/inventory/:id - Update minimum stock level
async function updateMinStock(req, res) {
  try {
    const { min_stock } = req.body;
    const [result] = await db.query('UPDATE inventory SET min_stock = ? WHERE id = ?', [min_stock, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Inventory record not found.' });
    res.json({ success: true, message: 'Minimum stock updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getInventory, updateMinStock };
