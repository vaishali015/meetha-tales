// Customer controller - admin views/manages customers
const db = require('../config/db');

// GET /api/customers - List all customers (admin)
async function getCustomers(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT id, full_name, email, phone, address, status, created_at FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, customers: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id - Get customer details with orders
async function getCustomer(req, res) {
  try {
    const [customers] = await db.query('SELECT id, full_name, email, phone, address, status, created_at FROM customers WHERE id = ?', [req.params.id]);
    if (customers.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const [orders] = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC', [req.params.id]);

    res.json({ success: true, customer: customers[0], orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/customers/:id/status - Activate/deactivate customer
async function updateCustomerStatus(req, res) {
  try {
    const { status } = req.body;
    const [result] = await db.query('UPDATE customers SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, message: 'Customer status updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCustomers, getCustomer, updateCustomerStatus };
