/* ============================================================
   Meetha Tales - Admin Dashboard JavaScript
   Handles all admin panel interactions
   ============================================================ */

// Admin API helper
async function adminApi(url, options = {}) {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isAdminLoggedIn()) {
    showDashboard();
  } else {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
  }
});

// Admin login form
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData);
  try {
    showLoading();
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    hideLoading();
    showToast('Admin login successful!', 'success');
    showDashboard();
  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
  }
});

function showDashboard() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'flex';
  loadDashboard();
}

function showSection(section, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-sidebar .nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + section).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);

  // Close sidebar on mobile
  if (window.innerWidth <= 992) document.getElementById('adminSidebar').classList.remove('open');

  // Load section data
  const loaders = {
    dashboard: loadDashboard,
    products: loadAdminProducts,
    categories: loadAdminCategories,
    customers: loadCustomers,
    orders: loadAdminOrders,
    payments: loadPayments,
    inventory: loadInventory,
    gallery: loadAdminGallery,
    messages: loadMessages,
  };
  if (loaders[section]) loaders[section]();
}

function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

// ---- Dashboard Stats ----
let salesChartInstance, statusChartInstance, popularChartInstance;

async function loadDashboard() {
  try {
    const data = await adminApi('/api/dashboard');
    const s = data.stats;
    document.getElementById('statProducts').textContent = s.total_products;
    document.getElementById('statCustomers').textContent = s.total_customers;
    document.getElementById('statOrders').textContent = s.total_orders;
    document.getElementById('statSales').textContent = 'Rs. ' + parseFloat(s.total_sales).toLocaleString('en-IN');
    document.getElementById('statPending').textContent = s.pending_orders;

    // Low stock list
    const lowStockHtml = s.low_stock_products.length > 0
      ? s.low_stock_products.map(p => `<div class="d-flex justify-content-between align-items-center py-2 border-bottom"><span>${p.name}</span><span class="status-badge ${p.quantity === 0 ? 'stock-out' : 'stock-low'}">${p.quantity} ${p.unit || ''} left (min: ${p.min_stock})</span></div>`).join('')
      : '<p class="text-muted text-center py-3">All products well stocked!</p>';
    document.getElementById('lowStockList').innerHTML = lowStockHtml;

    // Charts
    renderSalesChart(data.charts.monthly_sales);
    renderStatusChart(data.charts.orders_by_status);
    renderPopularChart(data.charts.popular_products);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSalesChart(data) {
  const ctx = document.getElementById('salesChart');
  if (salesChartInstance) salesChartInstance.destroy();
  const labels = data.map(d => d.month);
  const values = data.map(d => parseFloat(d.sales));
  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Sales (Rs.)', data: values, backgroundColor: '#800020', borderRadius: 6 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function renderStatusChart(data) {
  const ctx = document.getElementById('statusChart');
  if (statusChartInstance) statusChartInstance.destroy();
  const labels = data.map(d => d.order_status);
  const values = data.map(d => d.count);
  const colors = ['#ffc107', '#17a2b8', '#6f42c1', '#28a745', '#20c997', '#dc3545'];
  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

function renderPopularChart(data) {
  const ctx = document.getElementById('popularChart');
  if (popularChartInstance) popularChartInstance.destroy();
  const labels = data.map(d => d.name);
  const values = data.map(d => parseInt(d.total_sold));
  popularChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Units Sold', data: values, backgroundColor: '#d4af37', borderRadius: 6 }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } },
  });
}

// ---- Products ----
async function loadAdminProducts() {
  try {
    const search = document.getElementById('productSearch')?.value || '';
    let url = '/api/products';
    if (search) url += '?search=' + encodeURIComponent(search);
    const data = await adminApi(url);
    const body = document.getElementById('productsBody');
    if (data.products.length === 0) { body.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No products found</td></tr>'; return; }
    body.innerHTML = data.products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td><img src="${getProductImageUrl(p.image)}" width="50" height="50" style="object-fit:cover;border-radius:6px;" onerror="this.src='${PRODUCT_IMAGES['default.jpg']}'"></td>
        <td>${p.name}</td>
        <td>${p.category_name || 'N/A'}</td>
        <td>Rs. ${parseFloat(p.price).toFixed(0)}</td>
        <td>${p.quantity} ${p.unit}</td>
        <td><span class="status-badge ${p.status === 'active' ? 'status-delivered' : 'status-cancelled'}">${p.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-gold" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g,"")}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function showProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = 'Add Product';
  // Load categories into dropdown
  try {
    const data = await adminApi('/api/categories');
    const select = document.getElementById('pCategory');
    select.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch(e) {}
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function editProduct(id) {
  try {
    const data = await adminApi('/api/products/' + id);
    const p = data.product;
    document.getElementById('productId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pQty').value = p.quantity;
    document.getElementById('pUnit').value = p.unit;
    document.getElementById('pImage').value = p.image || '';
    document.getElementById('pRating').value = p.rating;
    document.getElementById('pStatus').value = p.status;
    document.getElementById('pDesc').value = p.description || '';
    // Load categories
    const catData = await adminApi('/api/categories');
    const select = document.getElementById('pCategory');
    select.innerHTML = '<option value="">Select Category</option>' + catData.categories.map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${c.name}</option>`).join('');
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    new bootstrap.Modal(document.getElementById('productModal')).show();
  } catch (err) { showToast(err.message, 'error'); }
}

async function saveProduct() {
  const id = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('pName').value,
    category_id: document.getElementById('pCategory').value || null,
    description: document.getElementById('pDesc').value,
    price: parseFloat(document.getElementById('pPrice').value),
    quantity: parseInt(document.getElementById('pQty').value),
    unit: document.getElementById('pUnit').value,
    image: document.getElementById('pImage').value,
    rating: parseFloat(document.getElementById('pRating').value),
    status: document.getElementById('pStatus').value,
  };
  try {
    showLoading();
    if (id) {
      await adminApi('/api/products/' + id, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await adminApi('/api/products', { method: 'POST', body: JSON.stringify(payload) });
    }
    hideLoading();
    showToast('Product saved successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    loadAdminProducts();
  } catch (err) { hideLoading(); showToast(err.message, 'error'); }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await adminApi('/api/products/' + id, { method: 'DELETE' });
    showToast('Product deleted.', 'success');
    loadAdminProducts();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Categories ----
async function loadAdminCategories() {
  try {
    const data = await adminApi('/api/categories');
    const body = document.getElementById('categoriesBody');
    body.innerHTML = data.categories.map(c => `
      <div class="col-md-4 col-lg-3">
        <div class="category-card position-relative">
          <i class="fas fa-tags cat-icon"></i>
          <div class="cat-name">${c.name}</div>
          <small class="text-muted d-block mt-2">${c.description || ''}</small>
          <span class="status-badge ${c.status === 'active' ? 'status-delivered' : 'status-cancelled'} mt-2 d-inline-block">${c.status}</span>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-gold" onclick="editCategory(${c.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${c.id}, '${c.name.replace(/'/g,"")}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

function showCategoryModal() {
  document.getElementById('catId').value = '';
  document.getElementById('catName').value = '';
  document.getElementById('catDesc').value = '';
  document.getElementById('catImage').value = '';
  document.getElementById('catStatus').value = 'active';
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
  new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

async function editCategory(id) {
  try {
    const data = await adminApi('/api/categories');
    const c = data.categories.find(x => x.id === id);
    if (!c) return;
    document.getElementById('catId').value = c.id;
    document.getElementById('catName').value = c.name;
    document.getElementById('catDesc').value = c.description || '';
    document.getElementById('catImage').value = c.image || '';
    document.getElementById('catStatus').value = c.status;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
  } catch (err) { showToast(err.message, 'error'); }
}

async function saveCategory() {
  const id = document.getElementById('catId').value;
  const payload = {
    name: document.getElementById('catName').value,
    description: document.getElementById('catDesc').value,
    image: document.getElementById('catImage').value,
    status: document.getElementById('catStatus').value,
  };
  try {
    showLoading();
    if (id) {
      await adminApi('/api/categories/' + id, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await adminApi('/api/categories', { method: 'POST', body: JSON.stringify(payload) });
    }
    hideLoading();
    showToast('Category saved!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
    loadAdminCategories();
  } catch (err) { hideLoading(); showToast(err.message, 'error'); }
}

async function deleteCategory(id, name) {
  if (!confirm(`Delete category "${name}"?`)) return;
  try {
    await adminApi('/api/categories/' + id, { method: 'DELETE' });
    showToast('Category deleted.', 'success');
    loadAdminCategories();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Customers ----
async function loadCustomers() {
  try {
    const search = document.getElementById('customerSearch')?.value || '';
    let url = '/api/customers';
    if (search) url += '?search=' + encodeURIComponent(search);
    const data = await adminApi(url);
    const body = document.getElementById('customersBody');
    if (data.customers.length === 0) { body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No customers found</td></tr>'; return; }
    body.innerHTML = data.customers.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.full_name}</td>
        <td>${c.email}</td>
        <td>${c.phone}</td>
        <td><button class="btn btn-sm btn-outline-gold" onclick="viewCustomerOrders(${c.id})">View Orders</button></td>
        <td><span class="status-badge ${c.status === 'active' ? 'status-delivered' : 'status-cancelled'}">${c.status}</span></td>
        <td>
          ${c.status === 'active'
            ? `<button class="btn btn-sm btn-outline-warning" onclick="toggleCustomer(${c.id}, 'inactive')">Deactivate</button>`
            : `<button class="btn btn-sm btn-outline-success" onclick="toggleCustomer(${c.id}, 'active')">Activate</button>`}
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function toggleCustomer(id, status) {
  try {
    await adminApi(`/api/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    showToast('Customer status updated.', 'success');
    loadCustomers();
  } catch (err) { showToast(err.message, 'error'); }
}

async function viewCustomerOrders(id) {
  try {
    const data = await adminApi('/api/customers/' + id);
    const c = data.customer;
    const body = document.getElementById('adminOrderModalBody');
    body.innerHTML = `
      <h5 class="text-maroon">${c.full_name}</h5>
      <p><strong>Email:</strong> ${c.email} | <strong>Phone:</strong> ${c.phone}</p>
      <p><strong>Address:</strong> ${c.address || 'N/A'}</p>
      <hr><h6>Orders (${data.orders.length})</h6>
      ${data.orders.length === 0 ? '<p class="text-muted">No orders yet.</p>' : `
      <table class="table table-sm"><thead><tr><th>Order #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${data.orders.map(o => `<tr><td>#${o.id}</td><td>${new Date(o.order_date).toLocaleDateString()}</td><td>Rs. ${parseFloat(o.total_amount).toFixed(0)}</td><td><span class="status-badge status-${o.order_status}">${o.order_status}</span></td></tr>`).join('')}</tbody></table>`}
    `;
    document.querySelector('#adminOrderModal .modal-title').textContent = 'Customer Details';
    new bootstrap.Modal(document.getElementById('adminOrderModal')).show();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Orders ----
const statusColors = { pending:'status-pending', confirmed:'status-confirmed', preparing:'status-preparing', ready:'status-ready', delivered:'status-delivered', cancelled:'status-cancelled' };

async function loadAdminOrders() {
  try {
    const data = await adminApi('/api/orders');
    const body = document.getElementById('ordersBody');
    if (data.orders.length === 0) { body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No orders found</td></tr>'; return; }
    body.innerHTML = data.orders.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.customer_name || 'N/A'}</td>
        <td>${new Date(o.order_date).toLocaleDateString()}</td>
        <td>Rs. ${parseFloat(o.total_amount).toFixed(0)}</td>
        <td>${o.payment_method.toUpperCase()} (${o.payment_status})</td>
        <td><span class="status-badge ${statusColors[o.order_status] || ''}">${o.order_status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-gold" onclick="viewAdminOrder(${o.id})"><i class="fas fa-eye"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function viewAdminOrder(id) {
  try {
    const data = await adminApi('/api/orders/' + id);
    const o = data.order;
    const body = document.getElementById('adminOrderModalBody');
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    body.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-6"><p><strong>Order #:</strong> ${o.id}</p><p><strong>Customer:</strong> ${o.customer_name || 'N/A'}</p><p><strong>Date:</strong> ${new Date(o.order_date).toLocaleString()}</p></div>
        <div class="col-md-6"><p><strong>Payment:</strong> ${o.payment_method.toUpperCase()} (${o.payment_status})</p><p><strong>Address:</strong> ${o.delivery_address || 'N/A'}</p></div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Update Order Status:</label>
        <div class="d-flex gap-2 flex-wrap">
          ${statuses.map(s => `<button class="btn btn-sm ${o.order_status === s ? 'btn-maroon' : 'btn-outline-gold'}" onclick="updateOrderStatus(${o.id}, '${s}')">${s}</button>`).join('')}
        </div>
      </div>
      <table class="table table-sm"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
      <tbody>${data.items.map(i => `<tr><td>${i.product_name || 'N/A'}</td><td>${i.quantity}</td><td>Rs. ${parseFloat(i.price).toFixed(0)}</td><td>Rs. ${parseFloat(i.subtotal).toFixed(0)}</td></tr>`).join('')}</tbody></table>
      <div class="text-end"><h5 class="text-maroon">Total: Rs. ${parseFloat(o.total_amount).toFixed(0)}</h5></div>
    `;
    document.querySelector('#adminOrderModal .modal-title').textContent = 'Order #' + o.id;
    new bootstrap.Modal(document.getElementById('adminOrderModal')).show();
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateOrderStatus(id, status) {
  try {
    await adminApi(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ order_status: status }) });
    showToast('Order status updated to ' + status, 'success');
    bootstrap.Modal.getInstance(document.getElementById('adminOrderModal')).hide();
    loadAdminOrders();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Payments ----
async function loadPayments() {
  try {
    const data = await adminApi('/api/payments');
    const body = document.getElementById('paymentsBody');
    if (data.payments.length === 0) { body.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No payments found</td></tr>'; return; }
    body.innerHTML = data.payments.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>#${p.order_id}</td>
        <td>${p.customer_name || 'N/A'}</td>
        <td>${p.payment_method.toUpperCase()}</td>
        <td>Rs. ${parseFloat(p.amount).toFixed(0)}</td>
        <td><span class="status-badge ${p.payment_status === 'paid' ? 'status-delivered' : p.payment_status === 'failed' ? 'status-cancelled' : 'status-pending'}">${p.payment_status}</span></td>
        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
        <td>
          <select class="form-select form-select-sm" onchange="updatePaymentStatus(${p.id}, this.value)" style="width:auto;">
            <option value="pending" ${p.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="paid" ${p.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="failed" ${p.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function updatePaymentStatus(id, status) {
  try {
    await adminApi(`/api/payments/${id}/status`, { method: 'PUT', body: JSON.stringify({ payment_status: status }) });
    showToast('Payment status updated.', 'success');
    loadPayments();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Inventory ----
async function loadInventory() {
  try {
    const data = await adminApi('/api/inventory');
    const body = document.getElementById('inventoryBody');
    if (data.inventory.length === 0) { body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No inventory records</td></tr>'; return; }
    body.innerHTML = data.inventory.map(i => `
      <tr>
        <td>${i.id}</td>
        <td>${i.product_name}</td>
        <td>${i.current_stock} ${i.unit}</td>
        <td><input type="number" class="form-control form-control-sm" value="${i.min_stock}" onchange="updateMinStock(${i.id}, this.value)" style="width:80px;"></td>
        <td><span class="status-badge ${i.stock_status === 'In Stock' ? 'status-delivered' : i.stock_status === 'Low Stock' ? 'status-pending' : 'status-cancelled'}">${i.stock_status}</span></td>
        <td><small class="text-muted">Change min stock above</small></td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateMinStock(id, minStock) {
  try {
    await adminApi(`/api/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ min_stock: parseInt(minStock) }) });
    showToast('Minimum stock updated.', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Gallery ----
async function loadAdminGallery() {
  try {
    const data = await adminApi('/api/gallery');
    const body = document.getElementById('adminGalleryBody');
    body.innerHTML = data.gallery.map(g => `
      <div class="col-md-4 col-lg-3">
        <div class="gallery-item">
          <img src="${getGalleryImageUrl(g.image)}" alt="${g.title}" style="height:180px;" onerror="this.src='${GALLERY_IMAGES['gallery-1.jpg']}'">
          <div class="overlay"><h5>${g.title}</h5></div>
          <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1 bg-white" onclick="deleteGalleryItem(${g.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

function showGalleryModal() {
  document.getElementById('gTitle').value = '';
  document.getElementById('gDesc').value = '';
  document.getElementById('gImage').value = '';
  document.getElementById('gCategory').value = 'sweets';
  new bootstrap.Modal(document.getElementById('galleryModal')).show();
}

async function saveGalleryItem() {
  const payload = {
    title: document.getElementById('gTitle').value,
    description: document.getElementById('gDesc').value,
    image: document.getElementById('gImage').value,
    category: document.getElementById('gCategory').value,
  };
  try {
    showLoading();
    await adminApi('/api/gallery', { method: 'POST', body: JSON.stringify(payload) });
    hideLoading();
    showToast('Gallery item added!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('galleryModal')).hide();
    loadAdminGallery();
  } catch (err) { hideLoading(); showToast(err.message, 'error'); }
}

async function deleteGalleryItem(id) {
  if (!confirm('Delete this gallery image?')) return;
  try {
    await adminApi('/api/gallery/' + id, { method: 'DELETE' });
    showToast('Gallery item deleted.', 'success');
    loadAdminGallery();
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Messages ----
async function loadMessages() {
  try {
    const data = await adminApi('/api/contact');
    const body = document.getElementById('messagesBody');
    if (data.messages.length === 0) { body.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No messages found</td></tr>'; return; }
    body.innerHTML = data.messages.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.subject || 'N/A'}</td>
        <td><small>${(m.message || '').substring(0, 50)}${m.message && m.message.length > 50 ? '...' : ''}</small></td>
        <td><span class="status-badge ${m.status === 'new' ? 'status-pending' : m.status === 'read' ? 'status-confirmed' : 'status-delivered'}">${m.status}</span></td>
        <td>${new Date(m.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-gold" onclick="viewMessage(${m.id})"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${m.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function viewMessage(id) {
  try {
    const data = await adminApi('/api/contact');
    const m = data.messages.find(x => x.id === id);
    if (!m) return;
    document.getElementById('adminOrderModalBody').innerHTML = `
      <p><strong>From:</strong> ${m.name} (${m.email})</p>
      <p><strong>Phone:</strong> ${m.phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${m.subject || 'N/A'}</p>
      <hr><p>${m.message}</p>
      <div class="mt-3">
        <select class="form-select" onchange="updateMessageStatus(${m.id}, this.value)" style="width:auto;">
          <option value="new" ${m.status === 'new' ? 'selected' : ''}>New</option>
          <option value="read" ${m.status === 'read' ? 'selected' : ''}>Read</option>
          <option value="replied" ${m.status === 'replied' ? 'selected' : ''}>Replied</option>
        </select>
      </div>
    `;
    document.querySelector('#adminOrderModal .modal-title').textContent = 'Message from ' + m.name;
    new bootstrap.Modal(document.getElementById('adminOrderModal')).show();
    // Mark as read
    if (m.status === 'new') updateMessageStatus(id, 'read');
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateMessageStatus(id, status) {
  try {
    await adminApi(`/api/contact/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    showToast('Message status updated.', 'success');
    loadMessages();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await adminApi('/api/contact/' + id, { method: 'DELETE' });
    showToast('Message deleted.', 'success');
    loadMessages();
  } catch (err) { showToast(err.message, 'error'); }
}
