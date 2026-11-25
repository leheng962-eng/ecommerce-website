// Shop page: search + filter + sort + pagination.
// The current filters live in the URL, so links can be shared and the Back button works.
initPage();

const state = {
  search: qs('search') || '',
  category: qs('category') || '',
  minPrice: qs('minPrice') || '',
  maxPrice: qs('maxPrice') || '',
  sort: qs('sort') || 'newest',
  onSale: qs('onSale') === 'true',
  page: parseInt(qs('page')) || 1,
};
let categories = [];

function syncInputs() {
  $('#searchBox').value = state.search;
  $('#minPrice').value = state.minPrice;
  $('#maxPrice').value = state.maxPrice;
  $('#sort').value = state.sort;
  $('#onSale').checked = state.onSale;
}

function renderCategories() {
  const row = (id, label) => `
    <label class="flex items-center gap-2 py-1 cursor-pointer">
      <input type="radio" name="cat" value="${id}" ${state.category === id ? 'checked' : ''} class="accent-blue-600"> ${esc(label)}
    </label>`;
  $('#categoryList').innerHTML = row('', 'All categories') + categories.map((c) => row(c._id, `${c.icon} ${c.name}`)).join('');
}

function readFilters() {
  state.search = $('#searchBox').value.trim();
  state.category = ($('input[name="cat"]:checked') || {}).value || '';
  state.minPrice = $('#minPrice').value;
  state.maxPrice = $('#maxPrice').value;
  state.onSale = $('#onSale').checked;
  state.page = 1;
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.category) params.set('category', state.category);
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.onSale) params.set('onSale', 'true');
  if (state.sort !== 'newest') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', state.page);

  history.replaceState(null, '', params.toString() ? `shop.html?${params}` : 'shop.html'); // update URL
  $('#grid').innerHTML = skeletonCards(6);

  const apiParams = new URLSearchParams(params);
  apiParams.set('sort', state.sort);
  apiParams.set('limit', 12);

  try {
    const data = await Api.get(`/products?${apiParams}`);
    $('#grid').innerHTML = data.products.length
      ? data.products.map(productCard).join('')
      : '<div class="col-span-full text-center py-16"><p class="text-5xl">🔍</p><p class="mt-3 font-semibold">No products found</p><p class="text-slate-500 text-sm">Try changing your filters.</p></div>';
    $('#resultInfo').textContent = `${data.total} product${data.total === 1 ? '' : 's'} found`;
    const cat = categories.find((c) => c._id === state.category);
    $('#pageTitle').textContent = state.onSale ? 'Deals' : cat ? cat.name : state.search ? `Results for "${state.search}"` : 'Shop';
    renderPagination(data.page, data.pages);
  } catch (err) {
    $('#grid').innerHTML = `<p class="col-span-full text-red-600">${esc(err.message)}</p>`;
  }
}

function renderPagination(page, pages) {
  if (pages <= 1) { $('#pagination').innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button data-page="${i}" class="btn ${i === page ? 'btn-primary' : 'btn-outline'} !px-3.5">${i}</button>`;
  }
  $('#pagination').innerHTML = html;
}

$('#pagination').addEventListener('click', (e) => {
  const b = e.target.closest('[data-page]');
  if (!b) return;
  state.page = Number(b.dataset.page);
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
$('#applyBtn').addEventListener('click', () => { readFilters(); loadProducts(); });
$('#resetBtn').addEventListener('click', () => {
  Object.assign(state, { search: '', category: '', minPrice: '', maxPrice: '', onSale: false, page: 1 });
  syncInputs(); renderCategories(); loadProducts();
});
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; loadProducts(); });
$('#searchBox').addEventListener('keydown', (e) => { if (e.key === 'Enter') { readFilters(); loadProducts(); } });
$('#filterToggle').addEventListener('click', () => $('#filters').classList.toggle('hidden'));

(async function init() {
  syncInputs();
  try { categories = (await Api.get('/categories')).categories; } catch (e) { categories = []; }
  renderCategories();
  loadProducts();
})();
