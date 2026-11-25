// Order confirmation page
initPage();

(async function () {
  if (!requireLogin()) return;
  const id = qs('id');
  try {
    const { order: o } = await Api.get(`/orders/${id}`);
    const a = o.shippingAddress;
    $('#root').innerHTML = `
    <div class="card p-8 fade-in">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-3xl">✓</div>
        <h1 class="text-3xl font-extrabold mt-4">Thank you for your order!</h1>
        <p class="text-slate-500 mt-1">Order <b>#${o._id.slice(-8).toUpperCase()}</b> was placed on ${fmtDate(o.createdAt)}.</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-6 mt-8 text-sm">
        <div><p class="font-semibold mb-1">Shipping to</p>
          <p class="text-slate-600 dark:text-slate-300">${esc(a.fullName)}<br>${esc(a.street)}<br>${esc(a.city)} ${esc(a.state)} ${esc(a.zip)}<br>${esc(a.country)}<br>${esc(a.phone)}</p></div>
        <div><p class="font-semibold mb-1">Payment &amp; status</p>
          <p class="text-slate-600 dark:text-slate-300">Method: ${o.paymentMethod === 'cod' ? 'Cash on delivery' : esc(o.paymentMethod)}<br>Status: <span class="badge badge-${o.status}">${o.status}</span></p></div>
      </div>

      <ul class="mt-6 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
        ${o.items.map((i) => `<li class="py-3 flex items-center gap-3">
          <img src="${esc(i.image) || PLACEHOLDER}" class="w-12 h-12 rounded-lg object-cover" onerror="this.src=PLACEHOLDER" alt="">
          <span class="flex-1">${esc(i.name)} <span class="text-slate-500">× ${i.quantity}</span></span>
          <span class="font-medium">${money(i.price * i.quantity)}</span></li>`).join('')}
      </ul>
      <dl class="mt-4 space-y-1 text-sm">
        <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>${money(o.itemsPrice)}</dd></div>
        <div class="flex justify-between"><dt class="text-slate-500">Shipping</dt><dd>${o.shippingPrice ? money(o.shippingPrice) : 'Free'}</dd></div>
        <div class="flex justify-between text-lg font-bold pt-2"><dt>Total</dt><dd>${money(o.totalPrice)}</dd></div>
      </dl>

      <div class="mt-8 flex flex-wrap gap-3 justify-center">
        <a href="profile.html#orders" class="btn btn-outline">View my orders</a>
        <a href="shop.html" class="btn btn-primary">Continue shopping</a>
      </div>
    </div>`;
  } catch (err) {
    $('#root').innerHTML = `<div class="card p-10 text-center"><p class="font-semibold">${esc(err.message)}</p><a href="index.html" class="btn btn-primary mt-4">Go home</a></div>`;
  }
})();
