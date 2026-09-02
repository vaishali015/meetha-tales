// Database connection configuration
// Uses mysql2 connection pool to connect to XAMPP MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for efficient database access
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mishra_sweets',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure XAMPP MySQL is running and the database exists.');
  }
})();

module.exports = pool;
