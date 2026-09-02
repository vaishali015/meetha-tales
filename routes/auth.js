const express = require('express');
const router = express.Router();
const { register, login, adminLogin, logout, me } = require('../controllers/authController');
const { authCustomer } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', logout);
router.get('/me', authCustomer, me);

module.exports = router;
