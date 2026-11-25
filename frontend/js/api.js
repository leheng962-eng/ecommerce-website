// api.js - one place that talks to the backend.
// Every page calls Api.get / Api.post / ... instead of using fetch() directly.
const Api = {
  // Same origin when Express serves the frontend. For another origin, set
  // window.API_BASE = 'http://localhost:5000/api' before loading this file.
  base: window.API_BASE || '/api',

  async request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`; // JWT goes in this header

    let res;
    try {
      res = await fetch(this.base + path, {
        method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error('Cannot reach the server. Is the backend running?');
    }

    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }

    if (!res.ok) {
      // Token expired or invalid: forget the saved login
      if (res.status === 401 && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get: (p) => Api.request(p),
  post: (p, body) => Api.request(p, { method: 'POST', body }),
  put: (p, body) => Api.request(p, { method: 'PUT', body }),
  del: (p) => Api.request(p, { method: 'DELETE' }),
};
