// Dashboard controller - admin stats
const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const [[productCount]] = await db.query('SELECT COUNT(*) AS count FROM products');
    const [[customerCount]] = await db.query('SELECT COUNT(*) AS count FROM customers');
    const [[orderCount]] = await db.query('SELECT COUNT(*) AS count FROM orders');
    const [[salesResult]] = await db.query('SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE order_status != "cancelled"');
    const [[pendingOrders]] = await db.query('SELECT COUNT(*) AS count FROM orders WHERE order_status = "pending"');
    const [lowStock] = await db.query(
      `SELECT p.name, p.quantity, i.min_stock FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.quantity <= i.min_stock ORDER BY p.quantity ASC`
    );

    // Monthly sales for the last 6 months
    const [monthlySales] = await db.query(
      `SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, COALESCE(SUM(total_amount), 0) AS sales
       FROM orders WHERE order_status != 'cancelled' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`
    );

    // Orders by status
    const [ordersByStatus] = await db.query(
      `SELECT order_status, COUNT(*) AS count FROM orders GROUP BY order_status`
    );

    // Popular products (by order quantity)
    const [popularProducts] = await db.query(
      `SELECT p.name, SUM(oi.quantity) AS total_sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY total_sold DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        total_products: productCount.count,
        total_customers: customerCount.count,
        total_orders: orderCount.count,
        total_sales: parseFloat(salesResult.total_sales),
        pending_orders: pendingOrders.count,
        low_stock_products: lowStock,
      },
      charts: {
        monthly_sales: monthlySales,
        orders_by_status: ordersByStatus,
        popular_products: popularProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getDashboardStats };
