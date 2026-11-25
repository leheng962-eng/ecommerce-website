// Profile page: personal info, order history, change password.
initPage();

if (requireLogin()) {
  const fields = ['name', 'phone', 'street', 'city', 'state', 'zip', 'country'];

  function showTab(name) {
    ['profile', 'orders', 'security'].forEach((t) => $('#tab-' + t).classList.toggle('hidden', t !== name));
    $$('.tab').forEach((b) => {
      const on = b.dataset.tab === name;
      b.classList.toggle('border-blue-600', on);
      b.classList.toggle('text-blue-600', on);
      b.classList.toggle('border-transparent', !on);
    });
    history.replaceState(null, '', '#' + name);
    if (name === 'orders') loadOrders();
  }
  $$('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  async function loadProfile() {
    try {
      const { user } = await Api.get('/auth/me');
      Auth.updateUser(user);
      $('#email').value = user.email;
      fields.forEach((f) => { $('#' + f).value = (f === 'name' || f === 'phone' ? user[f] : user.address?.[f]) || ''; });
    } catch (err) { if (err.status === 401) location.href = 'login.html?redirect=profile.html'; }
  }

  $('#profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    if (!name) return toast('Name is required', 'error');
    try {
      const { user } = await Api.put('/auth/me', {
        name, phone: $('#phone').value.trim(),
        address: { street: $('#street').value.trim(), city: $('#city').value.trim(), state: $('#state').value.trim(), zip: $('#zip').value.trim(), country: $('#country').value.trim() },
      });
      Auth.updateUser(user);
      toast('Profile updated');
    } catch (err) { toast(err.message, 'error'); }
  });

  $('#passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await Api.put('/auth/password', { currentPassword: $('#currentPassword').value, newPassword: $('#newPassword').value });
      e.target.reset();
      toast('Password updated');
    } catch (err) { toast(err.message, 'error'); }
  });

  async function loadOrders() {
    const box = $('#ordersList');
    box.innerHTML = '<div class="skeleton h-32"></div>';
    try {
      const { orders } = await Api.get('/orders/mine');
      if (!orders.length) {
        box.innerHTML = '<div class="card p-10 text-center"><p class="text-5xl">📦</p><p class="mt-3 font-semibold">No orders yet</p><a href="shop.html" class="btn btn-primary mt-4">Start shopping</a></div>';
        return;
      }
      box.innerHTML = `<div class="space-y-4">${orders.map((o) => `
        <article class="card p-5">
          <div class="flex flex-wrap justify-between gap-2">
            <div><p class="font-bold">Order #${o._id.slice(-8).toUpperCase()}</p><p class="text-sm text-slate-500">${fmtDate(o.createdAt)}</p></div>
            <div class="text-right"><span class="badge badge-${o.status}">${o.status}</span><p class="font-bold mt-1">${money(o.totalPrice)}</p></div>
          </div>
          <div class="flex gap-2 mt-3 overflow-x-auto">
            ${o.items.map((i) => `<img title="${esc(i.name)} × ${i.quantity}" src="${esc(i.image) || PLACEHOLDER}" class="w-14 h-14 rounded-lg object-cover shrink-0" onerror="this.src=PLACEHOLDER" alt="">`).join('')}
          </div>
          <p class="text-sm text-slate-500 mt-2">${o.items.map((i) => `${esc(i.name)} × ${i.quantity}`).join(', ')}</p>
          <a href="order-success.html?id=${o._id}" class="text-sm text-blue-600 font-medium hover:underline">View details</a>
        </article>`).join('')}</div>`;
    } catch (err) { box.innerHTML = `<p class="text-red-600">${esc(err.message)}</p>`; }
  }

  loadProfile();
  showTab(['profile', 'orders', 'security'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'profile');
}
