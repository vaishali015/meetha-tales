const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { authCustomer } = require('../middleware/auth');

router.get('/', authCustomer, getCart);
router.post('/', authCustomer, addToCart);
router.put('/:id', authCustomer, updateCartItem);
router.delete('/:id', authCustomer, removeCartItem);
router.delete('/', authCustomer, clearCart);

module.exports = router;
