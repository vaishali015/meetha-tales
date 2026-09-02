const express = require('express');
const router = express.Router();
const { getGallery, addGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { authAdmin } = require('../middleware/auth');

router.get('/', getGallery);
router.post('/', authAdmin, addGalleryItem);
router.delete('/:id', authAdmin, deleteGalleryItem);

module.exports = router;
