// Checkout page
initPage();

(async function () {
  if (!requireLogin()) return;

  // Pre-fill the form with the saved profile
  const u = Auth.user;
  $('#fullName').value = u.name || '';
  $('#phone').value = u.phone || '';
  ['street', 'city', 'state', 'zip', 'country'].forEach((f) => { $('#' + f).value = u.address?.[f] || ''; });

  const cart = await Cart.load();
  if (cart.items.length === 0) { location.href = 'cart.html'; return; }

  const shipping = shippingFor(cart.subtotal);
  $('#summary').innerHTML = `
    <ul class="divide-y divide-slate-200 dark:divide-slate-800 text-sm mb-4">
      ${cart.items.map(({ product: p, quantity, lineTotal }) => `
        <li class="py-2 flex justify-between gap-3"><span>${esc(p.name)} <span class="text-slate-500">× ${quantity}</span></span><span class="font-medium">${money(lineTotal)}</span></li>`).join('')}
    </ul>
    <dl class="space-y-2 text-sm">
      <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>${money(cart.subtotal)}</dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Shipping</dt><dd>${shipping === 0 ? 'Free' : money(shipping)}</dd></div>
      <div class="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-800 pt-3"><dt>Total</dt><dd>${money(cart.subtotal + shipping)}</dd></div>
    </dl>`;

  $('#checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#formError');
    err.classList.add('hidden');

    const shippingAddress = {};
    ['fullName', 'phone', 'street', 'city', 'state', 'zip', 'country'].forEach((f) => { shippingAddress[f] = $('#' + f).value.trim(); });

    // Front-end validation (the server validates again: never trust only the browser)
    const required = { fullName: 'Full name', phone: 'Phone', street: 'Street address', city: 'City', country: 'Country' };
    for (const [k, label] of Object.entries(required)) {
      if (!shippingAddress[k]) { err.textContent = `${label} is required`; err.classList.remove('hidden'); $('#' + k).focus(); return; }
    }

    const btn = $('#placeBtn');
    btn.disabled = true; btn.textContent = 'Placing order...';
    try {
      const { order } = await Api.post('/orders', {
        shippingAddress, paymentMethod: $('input[name="pay"]:checked').value,
      });
      await Cart.load(); // cart is empty now, refresh the header badge
      location.href = `order-success.html?id=${order._id}`;
    } catch (ex) {
      err.textContent = ex.message; err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Confirm order';
    }
  });
})();
