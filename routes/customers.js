const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, updateCustomerStatus } = require('../controllers/customerController');
const { authAdmin } = require('../middleware/auth');

router.get('/', authAdmin, getCustomers);
router.get('/:id', authAdmin, getCustomer);
router.put('/:id/status', authAdmin, updateCustomerStatus);

module.exports = router;
