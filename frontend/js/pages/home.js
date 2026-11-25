// Home page logic
initPage();

/* ---- Hero slider (3 promotional banners) ---- */
const slides = [
  { tag: 'Welcome to ShopNest', title: 'Discover. Shop. Enjoy.', text: 'Find the best products at the best prices. Fast delivery. Easy returns.',
    cta: ['Shop now', 'shop.html'], bg: 'from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800', dark: false,
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=70' },
  { tag: 'Mega Sale', title: 'Save big on tech', text: 'Headphones, watches and cameras with up to 30% off.',
    cta: ['See deals', 'shop.html?onSale=true'], bg: 'from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800', dark: false,
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=70' },
  { tag: 'Just landed', title: 'New arrivals are here', text: 'Be the first to get our latest products.',
    cta: ['Explore', 'shop.html?sort=newest'], bg: 'from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800', dark: false,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70' },
];
let current = 0;
$('#slides').innerHTML = slides.map((s, i) => `
  <div class="slide absolute inset-0 bg-gradient-to-r ${s.bg} grid md:grid-cols-2 items-center gap-6 p-8 md:p-14 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
    <div>
      <p class="text-blue-600 font-semibold text-sm uppercase tracking-wide">${s.tag}</p>
      <h1 class="text-4xl md:text-5xl font-extrabold mt-2 leading-tight">${s.title}</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-300 max-w-md">${s.text}</p>
      <a href="${s.cta[1]}" class="btn btn-primary mt-6 px-6 py-3">${s.cta[0]}</a>
    </div>
    <img src="${s.img}" alt="" class="hidden md:block w-full max-h-72 object-cover rounded-2xl shadow-xl" onerror="this.style.display='none'">
  </div>`).join('');
$('#dots').innerHTML = slides.map((_, i) => `<button class="dot w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-300'}" aria-label="Slide ${i + 1}"></button>`).join('');

function showSlide(n) {
  current = (n + slides.length) % slides.length;
  $$('.slide').forEach((el, i) => {
    el.classList.toggle('opacity-100', i === current);
    el.classList.toggle('opacity-0', i !== current);
    el.classList.toggle('pointer-events-none', i !== current);
  });
  $$('.dot').forEach((el, i) => {
    el.classList.toggle('bg-blue-600', i === current);
    el.classList.toggle('bg-slate-300', i !== current);
  });
}
$$('.dot').forEach((d, i) => d.addEventListener('click', () => showSlide(i)));
setInterval(() => showSlide(current + 1), 5500); // auto change every 5.5 seconds

/* ---- Load data from the API ---- */
async function loadSection(selector, query, emptyText) {
  const box = $(selector);
  box.innerHTML = skeletonCards(4);
  try {
    const { products } = await Api.get(`/products?${query}`);
    box.innerHTML = products.length ? products.map(productCard).join('') : `<p class="col-span-full text-slate-500">${emptyText}</p>`;
  } catch (err) {
    box.innerHTML = `<p class="col-span-full text-red-600">${esc(err.message)}</p>`;
  }
}

async function loadCategories() {
  try {
    const { categories } = await Api.get('/categories');
    $('#categories').innerHTML = categories.map((c) => `
      <a href="shop.html?category=${c._id}" class="card p-5 text-center hover:border-blue-500 hover:shadow-md transition">
        <div class="text-4xl">${esc(c.icon)}</div>
        <p class="mt-2 font-semibold text-sm">${esc(c.name)}</p>
        <p class="text-xs text-slate-500">${c.productCount} items</p>
      </a>`).join('');
  } catch (err) {
    $('#categories').innerHTML = `<p class="col-span-full text-red-600">${esc(err.message)}</p>`;
  }
}

loadCategories();
loadSection('#featured', 'featured=true&limit=8', 'No featured products yet.');
loadSection('#offers', 'onSale=true&limit=4&sort=popular', 'No offers right now.');
loadSection('#best', 'sort=popular&limit=4', 'No products yet.');
