const express = require('express');
const router = express.Router();
const { getInventory, updateMinStock } = require('../controllers/inventoryController');
const { authAdmin } = require('../middleware/auth');

router.get('/', authAdmin, getInventory);
router.put('/:id', authAdmin, updateMinStock);

module.exports = router;
