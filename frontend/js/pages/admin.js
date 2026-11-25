// Admin dashboard (single page with 5 sections).
// Security note: hiding this page is NOT security. The real protection is on the
// server: every /api/admin/* and write route checks the JWT and the "admin" role.

const root = $('#adminApp');
const SECTIONS = [
  ['dashboard', 'Dashboard', '📊'], ['products', 'Products', '📦'], ['categories', 'Categories', '🗂️'],
  ['orders', 'Orders', '🧾'], ['customers', 'Customers', '👥'],
];

/* ---------- Modal ---------- */
function openModal(title, html) {
  $('#modalRoot').innerHTML = `
  <div class="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" id="modalBg">
    <div class="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 fade-in">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">${esc(title)}</h3>
        <button id="modalClose" class="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
      </div>
      ${html}
    </div>
  </div>`;
  $('#modalClose').onclick = closeModal;
  $('#modalBg').addEventListener('mousedown', (e) => { if (e.target.id === 'modalBg') closeModal(); });
}
const closeModal = () => { $('#modalRoot').innerHTML = ''; };

/* ---------- Login gate ---------- */
function renderLogin(message = '') {
  root.innerHTML = `
  <div class="min-h-screen grid place-items-center p-4">
    <div class="card p-8 w-full max-w-sm fade-in">
      <p class="font-extrabold text-xl text-blue-600">ShopNest <span class="text-slate-400 font-semibold">Admin</span></p>
      <h1 class="text-2xl font-extrabold mt-4">Admin login</h1>
      <form id="adminLogin" class="mt-5 space-y-4" novalidate>
        <div><label class="label" for="aEmail">Email</label><input id="aEmail" type="email" class="input" required></div>
        <div><label class="label" for="aPass">Password</label><input id="aPass" type="password" class="input" required></div>
        <p id="aErr" class="${message ? '' : 'hidden'} text-sm text-red-600">${esc(message)}</p>
        <button class="btn btn-primary w-full py-3">Log in</button>
      </form>
      <a href="index.html" class="block text-center text-sm text-slate-500 mt-4 hover:text-blue-600">← Back to store</a>
    </div>
  </div>`;
  $('#adminLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await Api.post('/auth/login', { email: $('#aEmail').value.trim(), password: $('#aPass').value });
      if (data.user.role !== 'admin') throw new Error('This account is not an administrator');
      Auth.setSession(data.token, data.user);
      start();
    } catch (err) {
      $('#aErr').textContent = err.message;
      $('#aErr').classList.remove('hidden');
    }
  });
}

/* ---------- Shell (sidebar + content) ---------- */
function renderShell() {
  root.innerHTML = `
  <div class="lg:flex min-h-screen">
    <aside id="sidebar" class="hidden lg:flex lg:flex-col w-64 shrink-0 bg-slate-900 text-slate-300 p-4 lg:sticky lg:top-0 lg:h-screen">
      <p class="font-extrabold text-xl text-white px-2 py-3">ShopNest <span class="text-blue-400 text-sm">Admin</span></p>
      <nav class="mt-4 space-y-1 flex-1">
        ${SECTIONS.map(([id, label, ic]) => `<a href="#${id}" data-nav="${id}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800">${ic} ${label}</a>`).join('')}
      </nav>
      <div class="border-t border-slate-800 pt-3 space-y-1 text-sm">
        <a href="index.html" class="block px-3 py-2 rounded-xl hover:bg-slate-800">🏬 View store</a>
        <button id="themeBtn2" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800">🌓 Toggle theme</button>
        <button id="adminLogout" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-red-400">⎋ Log out (${esc(Auth.user.name)})</button>
      </div>
    </aside>
    <div class="flex-1 min-w-0">
      <div class="lg:hidden bg-slate-900 text-white p-3 flex items-center justify-between">
        <button id="sbToggle" class="text-2xl px-2" aria-label="Menu">☰</button><span class="font-bold">ShopNest Admin</span><span></span>
      </div>
      <main id="content" class="p-4 md:p-8"></main>
    </div>
  </div>`;
  $('#themeBtn2').onclick = toggleTheme;
  $('#adminLogout').onclick = () => { Auth.clear(); location.reload(); };
  $('#sbToggle').onclick = () => $('#sidebar').classList.toggle('hidden');
  $$('[data-nav]').forEach((a) => a.addEventListener('click', () => { if (innerWidth < 1024) $('#sidebar').classList.add('hidden'); }));
}

function route() {
  const id = SECTIONS.some((s) => s[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
  $$('[data-nav]').forEach((a) => {
    const on = a.dataset.nav === id;
    a.classList.toggle('bg-blue-600', on); a.classList.toggle('text-white', on);
  });
  ({ dashboard: viewDashboard, products: viewProducts, categories: viewCategories, orders: viewOrders, customers: viewCustomers })[id]();
}

const loading = () => { $('#content').innerHTML = '<div class="skeleton h-40"></div>'; };
const failed = (err) => { $('#content').innerHTML = `<p class="text-red-600">${esc(err.message)}</p>`; };
const pageHead = (title, right = '') => `<div class="flex flex-wrap items-center justify-between gap-3 mb-6"><h1 class="text-2xl font-extrabold">${title}</h1>${right}</div>`;

/* ---------- Dashboard ---------- */
async function viewDashboard() {
  loading();
  try {
    const s = await Api.get('/admin/stats');
    const max = Math.max(...s.salesByDay.map((d) => d.total), 1);
    const card = (label, value, ic, color) => `<div class="card p-5"><div class="flex justify-between items-start"><div class="text-2xl w-11 h-11 rounded-xl grid place-items-center ${color}">${ic}</div></div><p class="text-2xl font-extrabold mt-3">${value}</p><p class="text-sm text-slate-500">${label}</p></div>`;
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    $('#content').innerHTML = `${pageHead('Dashboard')}
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      ${card('Total revenue', money(s.revenue), '💰', 'bg-emerald-100 dark:bg-emerald-900/40')}
      ${card('Orders', s.orders, '🧾', 'bg-blue-100 dark:bg-blue-900/40')}
      ${card('Products', s.products, '📦', 'bg-amber-100 dark:bg-amber-900/40')}
      ${card('Customers', s.users, '👥', 'bg-purple-100 dark:bg-purple-900/40')}
    </div>

    <div class="card p-5 mt-6">
      <h2 class="font-bold mb-4">Sales – last 14 days</h2>
      <div class="flex items-end gap-2 h-52">
        ${s.salesByDay.map((d) => `
          <div class="flex-1 flex flex-col items-center justify-end h-full group" title="${d.date}: ${money(d.total)}">
            <span class="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100">${money(d.total)}</span>
            <div class="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition" style="height:${Math.max((d.total / max) * 100, d.total ? 3 : 1)}%"></div>
            <span class="text-[10px] text-slate-400 mt-1">${d.date.slice(8)}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 mt-6">
      <div class="card p-5"><h2 class="font-bold mb-3">Orders by status</h2>
        <ul class="space-y-2 text-sm">${statuses.map((st) => `<li class="flex justify-between"><span class="badge badge-${st}">${st}</span><b>${s.ordersByStatus[st] || 0}</b></li>`).join('')}</ul></div>
      <div class="card p-5"><h2 class="font-bold mb-3">Top selling products</h2>
        <ul class="space-y-3 text-sm">${s.topProducts.map((p) => `<li class="flex items-center gap-3"><img src="${esc(p.image) || PLACEHOLDER}" onerror="this.src=PLACEHOLDER" class="w-10 h-10 rounded-lg object-cover" alt=""><span class="flex-1 truncate">${esc(p.name)}</span><b>${p.sold} sold</b></li>`).join('') || '<li class="text-slate-500">No data yet</li>'}</ul></div>
      <div class="card p-5"><h2 class="font-bold mb-3">Low stock</h2>
        <ul class="space-y-2 text-sm">${s.lowStock.map((p) => `<li class="flex justify-between"><span class="truncate pr-2">${esc(p.name)}</span><b class="${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}">${p.stock} left</b></li>`).join('') || '<li class="text-slate-500">All good ✅</li>'}</ul></div>
    </div>`;
  } catch (err) { failed(err); }
}

/* ---------- Products ---------- */
let productSearch = '';
async function viewProducts() {
  loading();
  try {
    const [{ categories }, { products, total }] = await Promise.all([
      Api.get('/categories'),
      Api.get(`/products?limit=60&sort=newest${productSearch ? `&search=${encodeURIComponent(productSearch)}` : ''}`),
    ]);
    $('#content').innerHTML = `${pageHead('Products', `<div class="flex gap-2">
        <input id="pSearch" class="input !w-56" placeholder="Search..." value="${esc(productSearch)}">
        <button id="addProduct" class="btn btn-primary">+ Add product</button></div>`)}
      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr>
            <th class="p-3">Product</th><th class="p-3">Category</th><th class="p-3">Price</th><th class="p-3">Stock</th><th class="p-3">Sold</th><th class="p-3 text-right">Actions</th></tr></thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${products.map((p) => `<tr>
              <td class="p-3"><div class="flex items-center gap-3"><img src="${esc(p.image) || PLACEHOLDER}" onerror="this.src=PLACEHOLDER" class="w-11 h-11 rounded-lg object-cover" alt="">
                <div><p class="font-semibold">${esc(p.name)}</p>${p.featured ? '<span class="text-[11px] text-amber-600 font-semibold">★ Featured</span>' : ''}</div></div></td>
              <td class="p-3">${esc(p.category?.name || '-')}</td>
              <td class="p-3">${money(p.price)}${p.oldPrice > p.price ? `<br><span class="text-xs text-slate-400 line-through">${money(p.oldPrice)}</span>` : ''}</td>
              <td class="p-3 ${p.stock <= 5 ? 'text-red-600 font-semibold' : ''}">${p.stock}</td>
              <td class="p-3">${p.sold}</td>
              <td class="p-3 text-right whitespace-nowrap"><button data-edit="${p._id}" class="btn btn-outline btn-sm">Edit</button> <button data-del="${p._id}" class="btn btn-danger btn-sm">Delete</button></td>
            </tr>`).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-500">No products found</td></tr>'}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-slate-500 mt-2">Showing ${products.length} of ${total}</p>`;

    let t; // wait until the admin stops typing before searching
    $('#pSearch').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { productSearch = e.target.value.trim(); viewProducts(); }, 400); });
    $('#addProduct').onclick = () => productForm(null, categories);
    $$('[data-edit]').forEach((b) => b.onclick = () => productForm(products.find((p) => p._id === b.dataset.edit), categories));
    $$('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try { await Api.del(`/products/${b.dataset.del}`); toast('Product deleted'); viewProducts(); } catch (err) { toast(err.message, 'error'); }
    });
  } catch (err) { failed(err); }
}

function productForm(p, categories) {
  if (!categories.length) return toast('Create a category first', 'error');
  const v = (x, d = '') => esc(p ? p[x] : d);
  openModal(p ? 'Edit product' : 'Add product', `
  <form id="pForm" class="grid sm:grid-cols-2 gap-4" novalidate>
    <div class="sm:col-span-2"><label class="label">Name *</label><input class="input" name="name" value="${v('name')}" required></div>
    <div class="sm:col-span-2"><label class="label">Description *</label><textarea class="input" name="description" rows="3" required>${v('description')}</textarea></div>
    <div><label class="label">Price ($) *</label><input class="input" name="price" type="number" step="0.01" min="0" value="${v('price')}" required></div>
    <div><label class="label">Old price ($) – for discounts</label><input class="input" name="oldPrice" type="number" step="0.01" min="0" value="${v('oldPrice', 0)}"></div>
    <div><label class="label">Category *</label><select class="input" name="category">${categories.map((c) => `<option value="${c._id}" ${p && p.category?._id === c._id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div><label class="label">Brand</label><input class="input" name="brand" value="${v('brand')}"></div>
    <div><label class="label">Stock *</label><input class="input" name="stock" type="number" min="0" step="1" value="${v('stock', 0)}" required></div>
    <div><label class="label">Image URL</label><input class="input" name="image" type="url" placeholder="https://..." value="${v('image')}"></div>
    <label class="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="featured" ${p?.featured ? 'checked' : ''} class="w-4 h-4 accent-blue-600"> Show on home page as featured</label>
    <p id="pErr" class="hidden sm:col-span-2 text-sm text-red-600"></p>
    <div class="sm:col-span-2 flex justify-end gap-2"><button type="button" class="btn btn-outline" id="pCancel">Cancel</button><button class="btn btn-primary">${p ? 'Save changes' : 'Create product'}</button></div>
  </form>`);
  $('#pCancel').onclick = closeModal;
  $('#pForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = {
      name: f.get('name').trim(), description: f.get('description').trim(), price: Number(f.get('price')),
      oldPrice: Number(f.get('oldPrice') || 0), category: f.get('category'), brand: f.get('brand').trim(),
      stock: Number(f.get('stock')), image: f.get('image').trim(), featured: f.get('featured') === 'on',
    };
    try {
      if (p) await Api.put(`/products/${p._id}`, body); else await Api.post('/products', body);
      closeModal(); toast(p ? 'Product updated' : 'Product created'); viewProducts();
    } catch (err) { $('#pErr').textContent = err.message; $('#pErr').classList.remove('hidden'); }
  });
}

/* ---------- Categories ---------- */
async function viewCategories() {
  loading();
  try {
    const { categories } = await Api.get('/categories');
    $('#content').innerHTML = `${pageHead('Categories', '<button id="addCat" class="btn btn-primary">+ Add category</button>')}
      <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        ${categories.map((c) => `<div class="card p-5 flex items-center gap-4">
          <div class="text-3xl">${esc(c.icon)}</div>
          <div class="flex-1 min-w-0"><p class="font-semibold">${esc(c.name)}</p><p class="text-xs text-slate-500">${c.productCount} products</p></div>
          <button data-edit="${c._id}" class="btn btn-outline btn-sm">Edit</button><button data-del="${c._id}" class="btn btn-danger btn-sm">Delete</button></div>`).join('') || '<p class="text-slate-500">No categories yet.</p>'}
      </div>`;
    $('#addCat').onclick = () => categoryForm(null);
    $$('[data-edit]').forEach((b) => b.onclick = () => categoryForm(categories.find((c) => c._id === b.dataset.edit)));
    $$('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Delete this category?')) return;
      try { await Api.del(`/categories/${b.dataset.del}`); toast('Category deleted'); viewCategories(); } catch (err) { toast(err.message, 'error'); }
    });
  } catch (err) { failed(err); }
}

function categoryForm(c) {
  openModal(c ? 'Edit category' : 'Add category', `
  <form id="cForm" class="space-y-4" novalidate>
    <div><label class="label">Name *</label><input class="input" name="name" value="${esc(c?.name || '')}" required></div>
    <div><label class="label">Icon (emoji)</label><input class="input" name="icon" value="${esc(c?.icon || '🛍️')}"></div>
    <div><label class="label">Description</label><input class="input" name="description" value="${esc(c?.description || '')}"></div>
    <p id="cErr" class="hidden text-sm text-red-600"></p>
    <div class="flex justify-end gap-2"><button type="button" class="btn btn-outline" id="cCancel">Cancel</button><button class="btn btn-primary">Save</button></div>
  </form>`);
  $('#cCancel').onclick = closeModal;
  $('#cForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = { name: f.get('name').trim(), icon: f.get('icon').trim() || '🛍️', description: f.get('description').trim() };
    try {
      if (c) await Api.put(`/categories/${c._id}`, body); else await Api.post('/categories', body);
      closeModal(); toast('Category saved'); viewCategories();
    } catch (err) { $('#cErr').textContent = err.message; $('#cErr').classList.remove('hidden'); }
  });
}

/* ---------- Orders ---------- */
let orderFilter = '';
async function viewOrders() {
  loading();
  try {
    const { orders } = await Api.get(`/orders${orderFilter ? `?status=${orderFilter}` : ''}`);
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    $('#content').innerHTML = `${pageHead('Orders', `<select id="oFilter" class="input !w-44"><option value="">All statuses</option>${statuses.map((s) => `<option value="${s}" ${orderFilter === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`)}
      <div class="card overflow-x-auto"><table class="w-full text-sm">
        <thead class="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th class="p-3">Order</th><th class="p-3">Customer</th><th class="p-3">Date</th><th class="p-3">Total</th><th class="p-3">Status</th><th class="p-3"></th></tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          ${orders.map((o) => `<tr>
            <td class="p-3 font-semibold">#${o._id.slice(-8).toUpperCase()}</td>
            <td class="p-3">${esc(o.user?.name || 'Deleted user')}<br><span class="text-xs text-slate-500">${esc(o.user?.email || '')}</span></td>
            <td class="p-3">${fmtDate(o.createdAt)}</td>
            <td class="p-3 font-semibold">${money(o.totalPrice)}</td>
            <td class="p-3"><select data-status="${o._id}" class="input !w-auto !py-1.5">${statuses.map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
            <td class="p-3 text-right"><button data-view="${o._id}" class="btn btn-outline btn-sm">Details</button></td>
          </tr>`).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-500">No orders found</td></tr>'}
        </tbody></table></div>`;
    $('#oFilter').onchange = (e) => { orderFilter = e.target.value; viewOrders(); };
    $$('[data-status]').forEach((sel) => sel.onchange = async () => {
      try { await Api.put(`/orders/${sel.dataset.status}/status`, { status: sel.value }); toast('Status updated'); } catch (err) { toast(err.message, 'error'); viewOrders(); }
    });
    $$('[data-view]').forEach((b) => b.onclick = () => {
      const o = orders.find((x) => x._id === b.dataset.view); const a = o.shippingAddress;
      openModal(`Order #${o._id.slice(-8).toUpperCase()}`, `
        <div class="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p class="font-semibold">Customer</p><p>${esc(o.user?.name || '')}<br>${esc(o.user?.email || '')}</p></div>
          <div><p class="font-semibold">Ship to</p><p>${esc(a.fullName)}<br>${esc(a.street)}, ${esc(a.city)} ${esc(a.zip)}<br>${esc(a.country)} · ${esc(a.phone)}</p></div>
        </div>
        <ul class="mt-4 divide-y divide-slate-200 dark:divide-slate-800 text-sm">${o.items.map((i) => `<li class="py-2 flex justify-between"><span>${esc(i.name)} × ${i.quantity}</span><b>${money(i.price * i.quantity)}</b></li>`).join('')}</ul>
        <p class="mt-3 text-sm text-slate-500">Payment: ${esc(o.paymentMethod)} · Shipping: ${money(o.shippingPrice)}</p>
        <p class="text-right text-lg font-bold mt-2">Total ${money(o.totalPrice)}</p>`);
    });
  } catch (err) { failed(err); }
}

/* ---------- Customers ---------- */
async function viewCustomers() {
  loading();
  try {
    const { users } = await Api.get('/admin/users');
    $('#content').innerHTML = `${pageHead('Customers')}
      <div class="card overflow-x-auto"><table class="w-full text-sm">
        <thead class="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Role</th><th class="p-3">Joined</th><th class="p-3">Orders</th><th class="p-3">Spent</th></tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          ${users.map((u) => `<tr><td class="p-3 font-semibold">${esc(u.name)}</td><td class="p-3">${esc(u.email)}</td>
            <td class="p-3"><span class="badge ${u.role === 'admin' ? 'badge-shipped' : 'badge-processing'}">${u.role}</span></td>
            <td class="p-3">${fmtDate(u.createdAt)}</td><td class="p-3">${u.orders}</td><td class="p-3">${money(u.spent)}</td></tr>`).join('')}
        </tbody></table></div>`;
  } catch (err) { failed(err); }
}

/* ---------- Start ---------- */
async function start() {
  if (!Auth.isLoggedIn) return renderLogin();
  try { // ask the server who we really are
    const { user } = await Api.get('/auth/me');
    Auth.updateUser(user);
    if (user.role !== 'admin') { Auth.clear(); return renderLogin('This account is not an administrator'); }
  } catch (err) { return renderLogin(); }
  renderShell();
  window.addEventListener('hashchange', route);
  route();
}
start();
