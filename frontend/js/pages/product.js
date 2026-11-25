// Product details page
initPage();

(async function () {
  const id = qs('id');
  if (!id) { location.href = 'shop.html'; return; }

  try {
    const { product: p } = await Api.get(`/products/${id}`);
    ProductCache.set(p._id, p);
    document.title = `${p.name} – ShopNest`;
    $('#crumb').textContent = p.name;

    const onSale = p.oldPrice > p.price;
    const out = p.stock <= 0;
    $('#detail').innerHTML = `
    <div class="card p-5 md:p-8 grid md:grid-cols-2 gap-8 fade-in">
      <div class="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src="${esc(p.image) || PLACEHOLDER}" alt="${esc(p.name)}" class="w-full h-full object-cover" onerror="this.src=PLACEHOLDER">
      </div>
      <div>
        <p class="text-sm text-blue-600 font-semibold">${esc(p.category?.name || '')}${p.brand ? ` · ${esc(p.brand)}` : ''}</p>
        <h1 class="text-3xl font-extrabold mt-1">${esc(p.name)}</h1>
        <div class="flex items-center gap-2 mt-2">${stars(p.rating)}<span class="text-sm text-slate-500">${p.rating.toFixed(1)} (${p.numReviews} reviews) · ${p.sold} sold</span></div>
        <div class="mt-4 flex items-baseline gap-3">
          <span class="text-3xl font-bold">${money(p.price)}</span>
          ${onSale ? `<span class="text-lg text-slate-400 line-through">${money(p.oldPrice)}</span><span class="badge bg-red-100 text-red-700">Save ${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ''}
        </div>
        <p class="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed">${esc(p.description)}</p>
        <p class="mt-4 text-sm font-medium ${out ? 'text-red-600' : p.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}">
          ${out ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left in stock` : 'In stock'}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <div class="flex items-center card !rounded-xl">
            <button id="minus" class="w-10 h-11 text-xl hover:text-blue-600" aria-label="Decrease">−</button>
            <span id="qty" class="w-10 text-center font-semibold">1</span>
            <button id="plus" class="w-10 h-11 text-xl hover:text-blue-600" aria-label="Increase">+</button>
          </div>
          <button id="addBtn" ${out ? 'disabled' : ''} class="btn btn-primary px-7 py-3">Add to cart</button>
          <button id="buyBtn" ${out ? 'disabled' : ''} class="btn btn-outline px-7 py-3">Buy now</button>
        </div>

        <ul class="mt-8 text-sm text-slate-500 space-y-1">
          <li>🚚 Free shipping on orders over ${money(SHIPPING.freeOver)}</li>
          <li>↩️ 30-day easy returns</li>
          <li>🔒 Secure checkout</li>
        </ul>
      </div>
    </div>`;

    let qty = 1;
    const setQty = (n) => { qty = Math.max(1, Math.min(n, p.stock || 1)); $('#qty').textContent = qty; };
    $('#minus').onclick = () => setQty(qty - 1);
    $('#plus').onclick = () => setQty(qty + 1);

    const addToCart = async () => {
      try { await Cart.add(p, qty); return true; } catch (err) { toast(err.message, 'error'); return false; }
    };
    $('#addBtn').onclick = async () => { if (await addToCart()) toast(`Added ${qty} × "${p.name}" to cart`); };
    $('#buyBtn').onclick = async () => { if (await addToCart()) location.href = 'cart.html'; };

    // Related products (same category)
    const rel = await Api.get(`/products?category=${p.category?._id}&limit=5`);
    const others = rel.products.filter((x) => x._id !== p._id).slice(0, 4);
    $('#related').innerHTML = others.length ? others.map(productCard).join('') : '<p class="text-slate-500 col-span-full">No related products.</p>';
  } catch (err) {
    $('#detail').innerHTML = `<div class="card p-10 text-center"><p class="text-5xl">😕</p><p class="mt-3 font-semibold">${esc(err.message)}</p><a href="shop.html" class="btn btn-primary mt-4">Back to shop</a></div>`;
  }
})();
