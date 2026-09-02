/* ============================================================
   Meetha Tales - Frontend JavaScript
   Handles all customer-facing interactions
   ============================================================ */

const API = ''; // Same origin

// ---- Product image mapping ----
// Maps sample product image filenames to real Pexels stock photos
const PRODUCT_IMAGES = {
  'pedha.jpg':           'https://images.pexels.com/photos/8887052/pexels-photo-8887052.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'kaju-katli.jpg':      'https://images.pexels.com/photos/11484120/pexels-photo-11484120.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'motichoor-laddu.jpg': 'https://images.pexels.com/photos/19151506/pexels-photo-19151506.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'besan-laddu.jpg':     'https://images.pexels.com/photos/9951856/pexels-photo-9951856.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'mysore-pak.jpg':      'https://images.pexels.com/photos/8887061/pexels-photo-8887061.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'jalebi.jpg':          'https://images.pexels.com/photos/8887011/pexels-photo-8887011.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'rasgulla.jpg':        'https://images.pexels.com/photos/37133961/pexels-photo-37133961.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'gulab-jamun.jpg':     'https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'milk-cake.jpg':       'https://images.pexels.com/photos/5864767/pexels-photo-5864767.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'dharwad-pedha.jpg':   'https://images.pexels.com/photos/8887026/pexels-photo-8887026.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'kaju-roll.jpg':       'https://images.pexels.com/photos/11484120/pexels-photo-11484120.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'badam-halwa.jpg':     'https://images.pexels.com/photos/8887063/pexels-photo-8887063.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'coconut-burfi.jpg':   'https://images.pexels.com/photos/5864767/pexels-photo-5864767.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'dry-fruit-laddu.jpg': 'https://images.pexels.com/photos/11484120/pexels-photo-11484120.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'sweet-box.jpg':       'https://images.pexels.com/photos/8819769/pexels-photo-8819769.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  'default.jpg':         'https://images.pexels.com/photos/8887052/pexels-photo-8887052.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
};

// Gallery image mapping
const GALLERY_IMAGES = {
  'gallery-1.jpg': 'https://images.pexels.com/photos/38524183/pexels-photo-38524183.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-2.jpg': 'https://images.pexels.com/photos/8887061/pexels-photo-8887061.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-3.jpg': 'https://images.pexels.com/photos/19151506/pexels-photo-19151506.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-4.jpg': 'https://images.pexels.com/photos/30251968/pexels-photo-30251968.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-5.jpg': 'https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-6.jpg': 'https://images.pexels.com/photos/8819769/pexels-photo-8819769.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-7.jpg': 'https://images.pexels.com/photos/11484120/pexels-photo-11484120.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  'gallery-8.jpg': 'https://images.pexels.com/photos/8819843/pexels-photo-8819843.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
};

// Helper: get image URL for a product
function getProductImageUrl(imageName) {
  if (!imageName) return PRODUCT_IMAGES['default.jpg'];
  if (imageName.startsWith('http')) return imageName;
  // Check local images first, then fallback to Pexels mapping
  if (PRODUCT_IMAGES[imageName]) return PRODUCT_IMAGES[imageName];
  // Try local path: /images/products/<filename>
  return '/images/products/' + imageName;
}

function getGalleryImageUrl(imageName) {
  if (!imageName) return GALLERY_IMAGES['gallery-1.jpg'];
  if (imageName.startsWith('http')) return imageName;
  if (GALLERY_IMAGES[imageName]) return GALLERY_IMAGES[imageName];
  return '/images/gallery/' + imageName;
}

// ---- Auth helpers ----
function getToken() { return localStorage.getItem('token'); }
function getAdminToken() { return localStorage.getItem('adminToken'); }
function isLoggedIn() { return !!getToken(); }
function isAdminLoggedIn() { return !!getAdminToken(); }

function getCustomer() {
  const c = localStorage.getItem('customer');
  return c ? JSON.parse(c) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('customer');
  showToast('Logged out successfully.', 'success');
  setTimeout(() => location.href = '/', 500);
}

function adminLogout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
  showToast('Admin logged out.', 'success');
  setTimeout(() => location.href = '/admin', 500);
}

// ---- API helper ----
async function api(url, options = {}) {
  const token = getToken();
  const adminToken = getAdminToken();
  const authToken = url.includes('/admin') ? adminToken : token;

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

  try {
    const res = await fetch(API + url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ---- Toast notifications ----
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ---- Loading helpers ----
function showLoading() {
  let overlay = document.querySelector('.spinner-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = '<div class="spinner-border text-warning" style="width:3rem;height:3rem;"></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}
function hideLoading() {
  const overlay = document.querySelector('.spinner-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ---- Star rating HTML ----
function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (half) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = full + (half ? 1 : 0); i < 5; i++) html += '<i class="far fa-star"></i>';
  return html;
}

// ---- Stock badge HTML ----
function getStockBadge(quantity) {
  if (quantity <= 0) return '<span class="stock-badge stock-out">Out of Stock</span>';
  if (quantity <= 5) return '<span class="stock-badge stock-low">Low Stock</span>';
  return '<span class="stock-badge stock-in">In Stock</span>';
}

// ---- Update navbar based on login status ----
function updateNavbar() {
  const cartLink = document.getElementById('navCartLink');
  const loginLink = document.getElementById('navLoginLink');
  const logoutLink = document.getElementById('navLogoutLink');
  const ordersLink = document.getElementById('navOrdersLink');
  const customer = getCustomer();

  if (isLoggedIn() && customer) {
    if (loginLink) loginLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'block';
    if (ordersLink) ordersLink.style.display = 'block';
    if (cartLink) cartLink.style.display = 'block';
  } else {
    if (loginLink) loginLink.style.display = 'block';
    if (logoutLink) logoutLink.style.display = 'none';
    if (ordersLink) ordersLink.style.display = 'none';
  }

  // Update cart count
  updateCartCount();
}

// ---- Cart count badge ----
async function updateCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  if (!isLoggedIn()) { badge.textContent = '0'; return; }
  try {
    const data = await api('/api/cart');
    badge.textContent = data.items ? data.items.length : 0;
  } catch (e) { badge.textContent = '0'; }
}

// ---- Add to cart ----
async function addToCart(productId, qty = 1) {
  if (!isLoggedIn()) {
    showToast('Please login to add items to cart.', 'info');
    setTimeout(() => location.href = '/login', 800);
    return;
  }
  try {
    showLoading();
    await api('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: qty }),
    });
    hideLoading();
    showToast('Product added to cart!', 'success');
    updateCartCount();
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
  }
}

// ---- Page initialization ----
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  // Set active nav link based on current path
  const path = window.location.pathname;
  document.querySelectorAll('.navbar .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/')) {
      link.classList.add('active');
    }
  });
});
