const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authAdmin } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', authAdmin, createCategory);
router.put('/:id', authAdmin, updateCategory);
router.delete('/:id', authAdmin, deleteCategory);

module.exports = router;
