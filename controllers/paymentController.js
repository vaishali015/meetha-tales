// Payment controller
const db = require('../config/db');

// GET /api/payments - List all payments (admin)
async function getPayments(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.*, o.customer_id, o.order_status, c.full_name AS customer_name
       FROM payments p JOIN orders o ON p.order_id = o.id LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY p.payment_date DESC`
    );
    res.json({ success: true, count: rows.length, payments: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/payments/:id/status - Update payment status (admin)
async function updatePaymentStatus(req, res) {
  try {
    const { payment_status } = req.body;
    const [result] = await db.query('UPDATE payments SET payment_status = ? WHERE id = ?', [payment_status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Payment not found.' });

    // Also update the order's payment status
    await db.query('UPDATE orders SET payment_status = ? WHERE id = (SELECT order_id FROM payments WHERE id = ?)', [payment_status, req.params.id]);

    res.json({ success: true, message: 'Payment status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getPayments, updatePaymentStatus };
