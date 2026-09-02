// Order controller
const db = require('../config/db');

// POST /api/orders - Place a new order
async function createOrder(req, res) {
  const conn = await db.getConnection();
  try {
    const { items, payment_method, delivery_address } = req.body;
    const customerId = req.user.id;

    if (!items || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Your cart is empty. Add products to place an order.' });
    }

    await conn.beginTransaction();

    // Validate each item and check stock
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const [products] = await conn.query('SELECT id, name, price, quantity FROM products WHERE id = ? AND status = "active"', [item.product_id]);
      if (products.length === 0) {
        throw new Error(`Product not found or inactive: ${item.product_id}`);
      }
      const product = products[0];
      if (item.quantity > product.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
      }
      const subtotal = parseFloat(product.price) * item.quantity;
      totalAmount += subtotal;
      orderItems.push({ product_id: product.id, name: product.name, quantity: item.quantity, price: product.price, subtotal });
    }

    // Create the order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount, payment_method, payment_status, order_status, delivery_address) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, totalAmount, payment_method || 'cod', 'pending', 'pending', delivery_address || '']
    );
    const orderId = orderResult.insertId;

    // Insert order items and reduce stock
    for (const oi of orderItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, oi.product_id, oi.quantity, oi.price, oi.subtotal]
      );
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [oi.quantity, oi.product_id]);
    }

    // Create payment record
    await conn.query(
      'INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES (?, ?, ?, ?)',
      [orderId, payment_method || 'cod', totalAmount, payment_method === 'cod' ? 'pending' : 'paid']
    );

    // Update order payment status
    if (payment_method && payment_method !== 'cod') {
      await conn.query('UPDATE orders SET payment_status = "paid" WHERE id = ?', [orderId]);
    }

    // Clear the customer's cart
    await conn.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE customer_id = ?)', [customerId]);

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order_id: orderId,
      total_amount: totalAmount,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(400).json({ success: false, message: err.message });
  }
}

// GET /api/orders - List orders (customer sees own, admin sees all)
async function getOrders(req, res) {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `SELECT o.*, c.full_name AS customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ORDER BY o.order_date DESC`;
      params = [];
    } else {
      query = `SELECT o.*, c.full_name AS customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.customer_id = ? ORDER BY o.order_date DESC`;
      params = [req.user.id];
    }
    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, orders: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/orders/:id - Get order details with items
async function getOrder(req, res) {
  try {
    let orderQuery = `SELECT o.*, c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?`;
    const [orders] = await db.query(orderQuery, [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const order = orders[0];
    // Customer can only view their own order
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, order, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/orders/:id/status - Update order status (admin only)
async function updateOrderStatus(req, res) {
  try {
    const { order_status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }
    const [result] = await db.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus };
