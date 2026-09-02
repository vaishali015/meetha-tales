// Contact controller
const db = require('../config/db');

// POST /api/contact - Submit a contact message
async function submitContact(req, res) {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }
    await db.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || '', subject || '', message]
    );
    res.status(201).json({ success: true, message: 'Your message has been sent. We will contact you soon!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/contact - List all contact messages (admin)
async function getMessages(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, messages: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/contact/:id/status - Update message status (admin)
async function updateMessageStatus(req, res) {
  try {
    const { status } = req.body;
    const [result] = await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: 'Message status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/contact/:id - Delete message (admin)
async function deleteMessage(req, res) {
  try {
    const [result] = await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { submitContact, getMessages, updateMessageStatus, deleteMessage };
