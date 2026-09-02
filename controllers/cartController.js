// Cart controller - manages cart and cart items for logged-in customers
const db = require('../config/db');

// Helper: get or create cart for a customer
async function getOrCreateCart(customerId) {
  const [carts] = await db.query('SELECT id FROM cart WHERE customer_id = ?', [customerId]);
  if (carts.length > 0) return carts[0].id;
  const [result] = await db.query('INSERT INTO cart (customer_id) VALUES (?)', [customerId]);
  return result.insertId;
}

// GET /api/cart - Get current customer's cart with items
async function getCart(req, res) {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image, p.unit, p.quantity AS stock, p.status
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?`,
      [cartId]
    );
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    res.json({ success: true, cart_id: cartId, items, subtotal, total: subtotal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/cart - Add product to cart
async function addToCart(req, res) {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'Product ID is required.' });

    const [products] = await db.query('SELECT id, quantity FROM products WHERE id = ? AND status = "active"', [product_id]);
    if (products.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    const qty = quantity || 1;
    const cartId = await getOrCreateCart(req.user.id);

    // Check if product already in cart
    const [existing] = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
    if (existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      if (newQty > products[0].quantity) {
        return res.status(400).json({ success: false, message: 'Cannot add more than available stock.' });
      }
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      if (qty > products[0].quantity) {
        return res.status(400).json({ success: false, message: 'Cannot add more than available stock.' });
      }
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, qty]);
    }

    res.json({ success: true, message: 'Product added to cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/cart/:id - Update cart item quantity
async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });

    const [items] = await db.query('SELECT ci.*, p.quantity AS stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    if (quantity > items[0].stock) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds available stock.' });
    }

    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/cart/:id - Remove item from cart
async function removeCartItem(req, res) {
  try {
    const [result] = await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/cart - Clear entire cart
async function clearCart(req, res) {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
