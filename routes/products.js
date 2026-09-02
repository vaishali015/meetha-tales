const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin-only routes
router.post('/', authAdmin, createProduct);
router.put('/:id', authAdmin, updateProduct);
router.delete('/:id', authAdmin, deleteProduct);

module.exports = router;
