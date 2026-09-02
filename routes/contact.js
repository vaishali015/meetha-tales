const express = require('express');
const router = express.Router();
const { submitContact, getMessages, updateMessageStatus, deleteMessage } = require('../controllers/contactController');
const { authAdmin } = require('../middleware/auth');

router.post('/', submitContact);
router.get('/', authAdmin, getMessages);
router.put('/:id/status', authAdmin, updateMessageStatus);
router.delete('/:id', authAdmin, deleteMessage);

module.exports = router;
