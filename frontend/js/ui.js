// ui.js - helpers and reusable "components": header, footer, product card, toast.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Escape text before putting it in HTML (protects against XSS)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const qs = (name) => new URLSearchParams(location.search).get(name);

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' fill='%2394a3b8' font-family='sans-serif' font-size='20' text-anchor='middle'>No image</text></svg>";

// Only allow redirects to our own pages (prevents open-redirect tricks)
const safeRedirect = (url, fallback = 'index.html') => (/^[a-z0-9_-]+\.html(\?.*)?$/i.test(url || '') ? url : fallback);

/* ---------- Dark mode ---------- */
function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.theme = dark ? 'dark' : 'light';
}

/* ---------- Toast notifications ---------- */
function toast(message, type = 'success') {
  let box = $('#toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.className = 'fixed bottom-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  const color = type === 'error' ? 'bg-red-600' : 'bg-slate-900 dark:bg-blue-600';
  el.className = `${color} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg fade-in max-w-xs`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Stars ---------- */
function stars(rating = 0) {
  const full = Math.round(rating);
  return `<span class="text-amber-400 text-sm tracking-tight">${'★'.repeat(full)}<span class="text-slate-300 dark:text-slate-600">${'★'.repeat(5 - full)}</span></span>`;
}

/* ---------- Product card ---------- */
const ProductCache = new Map(); // id -> product, so "Add to cart" buttons can find the data

function productCard(p) {
  ProductCache.set(p._id, p);
  const onSale = p.oldPrice > p.price;
  const pct = onSale ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const out = p.stock <= 0;
  return `
  <article class="product-card card overflow-hidden flex flex-col fade-in">
    <a href="product.html?id=${p._id}" class="relative block aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <img src="${esc(p.image) || PLACEHOLDER}" alt="${esc(p.name)}" loading="lazy" onerror="this.src=PLACEHOLDER"
           class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
      ${onSale ? `<span class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">-${pct}%</span>` : ''}
      ${out ? `<span class="absolute top-3 right-3 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md">Sold out</span>` : ''}
    </a>
    <div class="p-4 flex flex-col flex-1">
      <p class="text-xs text-slate-500 dark:text-slate-400">${esc(p.category?.name || '')}</p>
      <a href="product.html?id=${p._id}" class="font-semibold leading-snug hover:text-blue-600 line-clamp-2">${esc(p.name)}</a>
      <div class="flex items-center gap-1 mt-1">${stars(p.rating)}<span class="text-xs text-slate-500">(${p.numReviews})</span></div>
      <div class="mt-2 mb-3 flex items-baseline gap-2">
        <span class="text-lg font-bold">${money(p.price)}</span>
        ${onSale ? `<span class="text-sm text-slate-400 line-through">${money(p.oldPrice)}</span>` : ''}
      </div>
      <button data-add="${p._id}" ${out ? 'disabled' : ''} class="btn btn-soft w-full mt-auto">
        ${out ? 'Out of stock' : 'Add to cart'}
      </button>
    </div>
  </article>`;
}

function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => `<div class="card p-3"><div class="skeleton aspect-square"></div><div class="skeleton h-4 mt-3 w-3/4"></div><div class="skeleton h-4 mt-2 w-1/2"></div></div>`).join('');
}

// One click listener for EVERY "Add to cart" button on the page (event delegation)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const product = ProductCache.get(btn.dataset.add);
  if (!product) return;
  btn.disabled = true;
  try {
    await Cart.add(product, 1);
    toast(`Added "${product.name}" to cart`);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = product.stock <= 0;
  }
});

/* ---------- Header ---------- */
const icon = {
  search: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  cart: '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
  user: '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  menu: '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  moon: '<svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg><svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4m11.2-11.2L19 5"/></svg>',
};

function renderHeader() {
  const here = (location.pathname.split('/').pop() || 'index.html') + location.search;
  const links = [
    ['index.html', 'Home'], ['shop.html', 'Shop'], ['shop.html?onSale=true', 'Deals'],
    ['shop.html?sort=newest', 'New Arrivals'], ['shop.html?sort=popular', 'Best Sellers'],
  ];
  const isActive = (href) => {
    const [page, query] = href.split('?');
    if (here.split('?')[0] !== page) return false;
    if (query) return here.includes(query);
    return !/(onSale=true|sort=newest|sort=popular)/.test(here);
  };
  const nav = links.map(([href, label]) =>
    `<a href="${href}" class="px-3 py-2 text-sm font-medium rounded-lg ${isActive(href)
      ? 'text-blue-600 bg-blue-50 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'}">${label}</a>`).join('');

  const u = Auth.user;
  const accountMenu = Auth.isLoggedIn
    ? `<div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700"><p class="text-sm font-semibold truncate">${esc(u.name)}</p><p class="text-xs text-slate-500 truncate">${esc(u.email)}</p></div>
       <a href="profile.html" class="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">My profile</a>
       <a href="profile.html#orders" class="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">My orders</a>
       ${Auth.isAdmin ? '<a href="admin.html" class="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Admin dashboard</a>' : ''}
       <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800">Log out</button>`
    : `<a href="login.html" class="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Log in</a>
       <a href="register.html" class="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Create account</a>`;

  $('#app-header').innerHTML = `
  <div class="bg-blue-600 text-white text-xs text-center py-2 px-4">Free shipping on orders over ${money(SHIPPING.freeOver)} · 30-day easy returns</div>
  <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
      <button id="menuBtn" class="lg:hidden p-2 -ml-2" aria-label="Menu">${icon.menu}</button>
      <a href="index.html" class="flex items-center gap-2 font-extrabold text-xl text-blue-600">
        <span class="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center text-base">S</span>ShopNest
      </a>
      <form id="searchForm" class="hidden md:flex flex-1 max-w-xl mx-auto relative">
        <input id="searchInput" type="search" placeholder="Search for products..." class="input pr-11" value="${esc(qs('search') || '')}">
        <button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600" aria-label="Search">${icon.search}</button>
      </form>
      <nav class="hidden lg:flex items-center ml-auto">${nav}</nav>
      <div class="flex items-center gap-1 ml-auto lg:ml-2">
        <button id="themeBtn" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle dark mode">${icon.moon}</button>
        <div class="relative">
          <button id="accountBtn" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Account">${icon.user}</button>
          <div id="accountMenu" class="hidden absolute right-0 mt-2 w-56 card shadow-xl overflow-hidden py-1">${accountMenu}</div>
        </div>
        <a href="cart.html" class="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cart">
          ${icon.cart}
          <span id="cartBadge" class="absolute -top-0.5 -right-0.5 min-w-[1.2rem] h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold grid place-items-center">0</span>
        </a>
      </div>
    </div>
    <div id="mobileMenu" class="hidden lg:hidden border-t border-slate-200 dark:border-slate-800 p-3">
      <form id="searchFormMobile" class="mb-2"><input type="search" id="searchInputMobile" placeholder="Search for products..." class="input"></form>
      <div class="grid">${nav}</div>
    </div>
  </header>`;

  // --- events ---
  const goSearch = (value) => { location.href = `shop.html?search=${encodeURIComponent(value.trim())}`; };
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); goSearch($('#searchInput').value); });
  $('#searchFormMobile').addEventListener('submit', (e) => { e.preventDefault(); goSearch($('#searchInputMobile').value); });
  $('#menuBtn').addEventListener('click', () => $('#mobileMenu').classList.toggle('hidden'));
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#accountBtn').addEventListener('click', (e) => { e.stopPropagation(); $('#accountMenu').classList.toggle('hidden'); });
  document.addEventListener('click', () => $('#accountMenu')?.classList.add('hidden'));
  $('#logoutBtn')?.addEventListener('click', () => Auth.logout());

  const updateBadge = () => { $('#cartBadge').textContent = Cart.data.totalItems; };
  window.addEventListener('cart:changed', updateBadge);
  Cart.load();
}

/* ---------- Footer ---------- */
function renderFooter() {
  const el = $('#app-footer');
  if (!el) return;
  const social = ['Facebook', 'Instagram', 'X', 'YouTube'].map((n) =>
    `<a href="#" class="w-9 h-9 grid place-items-center rounded-full bg-slate-800 hover:bg-blue-600 text-xs font-bold" aria-label="${n}">${n[0]}</a>`).join('');
  el.innerHTML = `
  <footer class="mt-16 bg-slate-900 text-slate-300">
    <div class="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p class="font-extrabold text-xl text-white mb-3">ShopNest</p>
        <p class="text-sm leading-relaxed">Quality products at fair prices, delivered fast to your door.</p>
        <div class="flex gap-2 mt-4">${social}</div>
      </div>
      <div>
        <p class="font-semibold text-white mb-3">Shop</p>
        <ul class="space-y-2 text-sm">
          <li><a class="hover:text-white" href="shop.html">All products</a></li>
          <li><a class="hover:text-white" href="shop.html?onSale=true">Deals</a></li>
          <li><a class="hover:text-white" href="shop.html?sort=newest">New arrivals</a></li>
          <li><a class="hover:text-white" href="shop.html?sort=popular">Best sellers</a></li>
        </ul>
      </div>
      <div>
        <p class="font-semibold text-white mb-3">Account</p>
        <ul class="space-y-2 text-sm">
          <li><a class="hover:text-white" href="login.html">Log in</a></li>
          <li><a class="hover:text-white" href="register.html">Register</a></li>
          <li><a class="hover:text-white" href="profile.html#orders">Track order</a></li>
          <li><a class="hover:text-white" href="cart.html">Cart</a></li>
        </ul>
      </div>
      <div>
        <p class="font-semibold text-white mb-3">Contact us</p>
        <ul class="space-y-2 text-sm">
          <li>📍 123 Market Street, Phnom Penh</li>
          <li>📞 +855 12 345 678</li>
          <li>✉️ support@shopnest.example</li>
          <li>🕘 Mon–Sat, 9:00–18:00</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-slate-800 text-center text-xs py-5">© ${new Date().getFullYear()} ShopNest. Demo project for learning.</div>
  </footer>`;
}

// Every normal page calls this once at the bottom of its HTML.
function initPage() {
  renderHeader();
  renderFooter();
}

// Redirect to login if the user is not signed in
function requireLogin() {
  if (!Auth.isLoggedIn) {
    location.href = `login.html?redirect=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`;
    return false;
  }
  return true;
}
