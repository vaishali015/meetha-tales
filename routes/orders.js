const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { authCustomer, authAdmin, optionalAuth } = require('../middleware/auth');

router.post('/', authCustomer, createOrder);
router.get('/', optionalAuth, getOrders);
router.get('/:id', optionalAuth, getOrder);
router.put('/:id/status', authAdmin, updateOrderStatus);

module.exports = router;
