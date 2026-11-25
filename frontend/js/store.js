// store.js - login state and the shopping cart.
// Guests keep their cart in localStorage. Logged-in users keep it in MongoDB.
// After login the guest cart is merged into the account.

const Auth = {
  get token() { return localStorage.getItem('token'); },
  get user() {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  },
  get isLoggedIn() { return !!this.token && !!this.user; },
  get isAdmin() { return !!this.user && this.user.role === 'admin'; },
  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  updateUser(user) { localStorage.setItem('user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  logout() { this.clear(); window.location.href = 'index.html'; },
};

const SHIPPING = { freeOver: 50, fee: 5 }; // must match backend/controllers/orderController.js
const shippingFor = (subtotal) => (subtotal === 0 || subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.fee);

const Cart = {
  data: { items: [], totalItems: 0, subtotal: 0 },

  // ----- guest helpers (localStorage) -----
  _guestItems() {
    try { return JSON.parse(localStorage.getItem('guestCart')) || []; } catch (e) { return []; }
  },
  _saveGuest(items) { localStorage.setItem('guestCart', JSON.stringify(items)); },
  _format(items) {
    const list = items.map((i) => ({
      product: i.product, quantity: i.quantity,
      lineTotal: +(i.product.price * i.quantity).toFixed(2),
    }));
    return {
      items: list,
      totalItems: list.reduce((s, i) => s + i.quantity, 0),
      subtotal: +list.reduce((s, i) => s + i.lineTotal, 0).toFixed(2),
    };
  },
  _set(data) {
    this.data = data;
    window.dispatchEvent(new CustomEvent('cart:changed')); // header badge listens
    return data;
  },

  // ----- public API -----
  async load() {
    if (Auth.isLoggedIn) {
      try { return this._set(await Api.get('/cart')); } catch (e) { /* fall through */ }
    }
    return this._set(this._format(this._guestItems()));
  },

  async add(product, qty = 1) {
    if (product.stock !== undefined && product.stock <= 0) throw new Error('Out of stock');
    if (Auth.isLoggedIn) {
      return this._set(await Api.post('/cart', { productId: product._id, quantity: qty }));
    }
    const items = this._guestItems();
    const found = items.find((i) => i.product._id === product._id);
    const newQty = (found ? found.quantity : 0) + qty;
    if (newQty > product.stock) throw new Error(`Only ${product.stock} in stock`);
    // Save a small snapshot so the cart page can render without the server
    const snap = { _id: product._id, name: product.name, price: product.price, image: product.image, stock: product.stock };
    if (found) { found.quantity = newQty; found.product = snap; } else items.push({ product: snap, quantity: qty });
    this._saveGuest(items);
    return this._set(this._format(items));
  },

  async setQty(productId, qty) {
    if (Auth.isLoggedIn) return this._set(await Api.put(`/cart/${productId}`, { quantity: qty }));
    let items = this._guestItems();
    const item = items.find((i) => i.product._id === productId);
    if (!item) return this.data;
    if (qty > item.product.stock) throw new Error(`Only ${item.product.stock} in stock`);
    if (qty <= 0) items = items.filter((i) => i !== item); else item.quantity = qty;
    this._saveGuest(items);
    return this._set(this._format(items));
  },

  async remove(productId) {
    if (Auth.isLoggedIn) return this._set(await Api.del(`/cart/${productId}`));
    const items = this._guestItems().filter((i) => i.product._id !== productId);
    this._saveGuest(items);
    return this._set(this._format(items));
  },

  // Called right after login/register
  async mergeGuest() {
    const guest = this._guestItems();
    if (guest.length && Auth.isLoggedIn) {
      try {
        await Api.post('/cart/merge', { items: guest.map((i) => ({ productId: i.product._id, quantity: i.quantity })) });
        localStorage.removeItem('guestCart');
      } catch (e) { /* keep the guest cart if merge fails */ }
    }
  },
};
