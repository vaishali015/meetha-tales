const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authAdmin } = require('../middleware/auth');

router.get('/', authAdmin, getDashboardStats);

module.exports = router;
