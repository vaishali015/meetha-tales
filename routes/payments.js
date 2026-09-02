const express = require('express');
const router = express.Router();
const { getPayments, updatePaymentStatus } = require('../controllers/paymentController');
const { authAdmin } = require('../middleware/auth');

router.get('/', authAdmin, getPayments);
router.put('/:id/status', authAdmin, updatePaymentStatus);

module.exports = router;
