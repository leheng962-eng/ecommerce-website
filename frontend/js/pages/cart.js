// Cart page: change quantities, remove items, see totals.
initPage();

function render() {
  const { items, totalItems, subtotal } = Cart.data;
  const root = $('#cartRoot');

  if (items.length === 0) {
    root.innerHTML = `
      <div class="card p-12 text-center fade-in">
        <p class="text-6xl">🛒</p>
        <p class="mt-4 text-xl font-bold">Your cart is empty</p>
        <p class="text-slate-500">Looks like you have not added anything yet.</p>
        <a href="shop.html" class="btn btn-primary mt-6">Start shopping</a>
      </div>`;
    return;
  }

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const missing = SHIPPING.freeOver - subtotal;

  root.innerHTML = `
  <div class="grid lg:grid-cols-[1fr_360px] gap-6 fade-in">
    <section class="card divide-y divide-slate-200 dark:divide-slate-800">
      ${items.map(({ product: p, quantity, lineTotal }) => `
        <div class="p-4 flex gap-4" data-id="${p._id}">
          <a href="product.html?id=${p._id}" class="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
            <img src="${esc(p.image) || PLACEHOLDER}" alt="" class="w-full h-full object-cover" onerror="this.src=PLACEHOLDER">
          </a>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between gap-3">
              <a href="product.html?id=${p._id}" class="font-semibold hover:text-blue-600">${esc(p.name)}</a>
              <p class="font-bold whitespace-nowrap">${money(lineTotal)}</p>
            </div>
            <p class="text-sm text-slate-500">${money(p.price)} each</p>
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center card !rounded-lg">
                <button data-act="minus" class="w-9 h-9 hover:text-blue-600" aria-label="Decrease">−</button>
                <span class="w-9 text-center text-sm font-semibold">${quantity}</span>
                <button data-act="plus" class="w-9 h-9 hover:text-blue-600" aria-label="Increase">+</button>
              </div>
              <button data-act="remove" class="text-sm text-red-600 hover:underline">Remove</button>
            </div>
          </div>
        </div>`).join('')}
    </section>

    <aside class="card p-6 h-fit lg:sticky lg:top-24">
      <h2 class="text-lg font-bold mb-4">Order Summary</h2>
      <dl class="space-y-3 text-sm">
        <div class="flex justify-between"><dt class="text-slate-500">Items</dt><dd>${totalItems}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>${money(subtotal)}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Shipping</dt><dd>${shipping === 0 ? 'Free' : money(shipping)}</dd></div>
        <div class="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-800 pt-3"><dt>Total</dt><dd>${money(total)}</dd></div>
      </dl>
      ${missing > 0 ? `<p class="mt-3 text-xs text-blue-600">Add ${money(missing)} more for free shipping!</p>` : '<p class="mt-3 text-xs text-emerald-600">You get free shipping 🎉</p>'}
      <button id="checkoutBtn" class="btn btn-primary w-full mt-5 py-3">Proceed to checkout</button>
      <a href="shop.html" class="btn btn-outline w-full mt-2">Continue shopping</a>
    </aside>
  </div>`;
}

$('#cartRoot').addEventListener('click', async (e) => {
  if (e.target.closest('#checkoutBtn')) {
    // Checkout needs an account, so guests go to login first and come back here.
    location.href = Auth.isLoggedIn ? 'checkout.html' : 'login.html?redirect=checkout.html';
    return;
  }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.closest('[data-id]').dataset.id;
  const item = Cart.data.items.find((i) => i.product._id === id);
  try {
    if (btn.dataset.act === 'plus') await Cart.setQty(id, item.quantity + 1);
    if (btn.dataset.act === 'minus') await Cart.setQty(id, item.quantity - 1);
    if (btn.dataset.act === 'remove') await Cart.remove(id);
  } catch (err) { toast(err.message, 'error'); }
  render();
});

Cart.load().then(render);
