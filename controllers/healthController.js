// Health check controller
const db = require('../config/db');

async function healthCheck(req, res) {
  try {
    await db.query('SELECT 1');
    res.json({
      success: true,
      server: 'running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      server: 'running',
      database: 'disconnected',
      error: err.message,
    });
  }
}

module.exports = { healthCheck };
