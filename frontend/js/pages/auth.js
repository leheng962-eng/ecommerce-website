// Used by BOTH login.html and register.html.
initPage();

const redirectTo = safeRedirect(qs('redirect'));
const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);

// keep the ?redirect= value when switching between login and register
if (qs('redirect')) {
  const r = `?redirect=${encodeURIComponent(qs('redirect'))}`;
  if ($('#regLink')) $('#regLink').href += r;
  if ($('#loginLink')) $('#loginLink').href += r;
}

function showError(msg) {
  const el = $('#error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function finishLogin(data) {
  Auth.setSession(data.token, data.user);
  await Cart.mergeGuest();         // move the guest cart into the account
  location.href = data.user.role === 'admin' && redirectTo === 'index.html' ? 'admin.html' : redirectTo;
}

const loginForm = $('#loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (!emailOk(email)) return showError('Please enter a valid email');
    if (!password) return showError('Please enter your password');
    $('#submitBtn').disabled = true;
    try {
      await finishLogin(await Api.post('/auth/login', { email, password }));
    } catch (err) {
      showError(err.message);
      $('#submitBtn').disabled = false;
    }
  });
}

const registerForm = $('#registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (!name) return showError('Please enter your name');
    if (!emailOk(email)) return showError('Please enter a valid email');
    if (password.length < 6) return showError('Password must be at least 6 characters');
    if (password !== $('#confirm').value) return showError('Passwords do not match');
    $('#submitBtn').disabled = true;
    try {
      await finishLogin(await Api.post('/auth/register', { name, email, password }));
    } catch (err) {
      showError(err.message);
      $('#submitBtn').disabled = false;
    }
  });
}
