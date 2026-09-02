// Authentication controller
// Handles customer registration, login, logout
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register - Customer registration
async function register(req, res) {
  try {
    const { full_name, email, phone, address, password, confirm_password } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please login.' });
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new customer
    const [result] = await db.query(
      'INSERT INTO customers (full_name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, phone, address || '', hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      customer_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
  }
}

// POST /api/auth/login - Customer login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find customer by email
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const customer = rows[0];

    if (customer.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, role: 'customer', name: customer.full_name, email: customer.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed: ' + err.message });
  }
}

// POST /api/auth/admin-login - Admin login
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin', name: admin.name, email: admin.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful!',
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin login failed: ' + err.message });
  }
}

// POST /api/auth/logout - Logout (client-side token removal)
async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

// GET /api/auth/me - Get current customer info
async function me(req, res) {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, phone, address FROM customers WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    res.json({ success: true, customer: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, adminLogin, logout, me };
