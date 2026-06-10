const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5051';
const API = `${API_ORIGIN}/api`;

function token() { return localStorage.getItem('token') || ''; }
export function profile() { try { return JSON.parse(localStorage.getItem('profile') || 'null'); } catch { return null; } }
function saveSession(data) { localStorage.setItem('token', data.token); localStorage.setItem('profile', JSON.stringify(data.user)); }
export function logout() { localStorage.removeItem('token'); localStorage.removeItem('profile'); }

async function request(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token() ? { Authorization: `Bearer ${token()}` } : {})
    }
  });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data.error || data || 'Erreur API');
  return data;
}

export const resolveImg = (p) => p?.startsWith('/images/') ? `${API_ORIGIN}${p}` : p || `${API_ORIGIN}/images/placeholder.svg`;
export const money = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));

export async function login(email, password) {
  const data = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  saveSession(data);
  return data.user;
}
export const me = () => request('/auth/me');
export async function register(firstName, lastName, email, password) {
  const data = await request('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, email, password }) });
  saveSession(data);
  return data.user;
}
export const forgotPassword = (email) => request('/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
export const resetPassword = (email, code, password) => request('/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, code, password }) });
export const getProducts = (filters={}) => request(`/products?${new URLSearchParams(Object.entries(filters).filter(([,v]) => v !== '' && v !== null && v !== undefined)).toString()}`);
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (payload) => request('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const updateProduct = (id,payload) => request(`/products/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const deleteProduct = (id) => request(`/products/${id}`, { method:'DELETE' });
export const getOrders = () => request('/orders');
export const updateOrder = (id,payload) => request(`/orders/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const checkout = (payload) => request('/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const getUsers = () => request('/users');
export const createUser = (payload) => request('/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const updateUser = (id, payload) => request(`/users/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const deleteUser = (id) => request(`/users/${id}`, { method:'DELETE' });
export const updateProfile = (payload) => request('/users/me', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const getReviews = (productId) => request(`/reviews/${productId}`);
export const addReview = (productId, payload) => request(`/reviews/${productId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
export const getAdminStats = () => request('/admin/stats');
export const getMappingSources = () => request('/mapping/sources');
export const refreshWebMapping = (targetCount=100) => request('/mapping/refresh', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ targetCount }) });
export const exportData = () => request('/rgpd/export');
export const deleteData = () => request('/rgpd/delete', { method:'DELETE' });

const CART_KEY = 'cart.v4';
export const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));
export function addCart(product, size, qty=1) {
  const items = getCart();
  const found = items.find(i => i.productId === product.id && String(i.size) === String(size));
  if (found) found.qty += Number(qty);
  else items.push({ productId: product.id, name: product.name, brand: product.brand, image: product.image, size: String(size), price: Number(product.price), qty: Number(qty) });
  saveCart(items); return items;
}
export function setQty(productId, size, qty) { const items = getCart().map(i => i.productId===productId && String(i.size)===String(size) ? { ...i, qty: Math.max(1, Number(qty||1)) } : i); saveCart(items); return items; }
export function removeCart(productId, size) { const items = getCart().filter(i => !(i.productId===productId && String(i.size)===String(size))); saveCart(items); return items; }
export function clearCart() { saveCart([]); }
export const cartCount = () => getCart().reduce((s,i)=>s+Number(i.qty||0),0);

const WISHLIST_KEY = 'wishlist.v1';
export const getWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
export function toggleWishlist(product) {
  const list = getWishlist();
  const idx = list.findIndex(p => p.id === product.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({ id: product.id, name: product.name, brand: product.brand, image: product.image, price: product.price, category: product.category });
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  return list;
}
export const isWishlisted = (id) => getWishlist().some(p => p.id === id);

const CONSENT_KEY = 'consent.v2';
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split('=')[1]) : null;
}
function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; sameSite=Lax`;
}
export const getConsent = () => {
  try {
    const cookieValue = getCookie(CONSENT_KEY);
    if (cookieValue) return JSON.parse(cookieValue);
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
  } catch {
    return null;
  }
};
export function setConsent(analytics, marketing) {
  const value = { functional: true, analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
  const str = JSON.stringify(value);
  localStorage.setItem(CONSENT_KEY, str);
  setCookie(CONSENT_KEY, str);
  return value;
}
