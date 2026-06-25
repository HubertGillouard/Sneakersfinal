const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = Number(process.env.PORT || 5051);
const JWT_SECRET = process.env.JWT_SECRET || 'sneakr-secret';

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const RECONDITIONING_FILE = path.join(DATA_DIR, 'reconditioning.json');
const MAPPING_AUDIT_FILE = path.join(DATA_DIR, 'mapping', 'last-import.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/images', express.static(path.join(ROOT, 'public', 'images')));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}
function products() { return readJson(PRODUCTS_FILE, []); }
function saveProducts(v) { writeJson(PRODUCTS_FILE, v); }
function users() { return readJson(USERS_FILE, []); }
function saveUsers(v) { writeJson(USERS_FILE, v); }
function orders() { return readJson(ORDERS_FILE, []); }
function saveOrders(v) { writeJson(ORDERS_FILE, v); }
function reviews() { return readJson(REVIEWS_FILE, []); }
function saveReviews(v) { writeJson(REVIEWS_FILE, v); }
function settings() { return readJson(SETTINGS_FILE, { brandName: 'SneakR', accent: '#7c3aed' }); }
function reconditioning() { return readJson(RECONDITIONING_FILE, []); }
function saveReconditioning(v) { writeJson(RECONDITIONING_FILE, v); }
const BASE_RECONDITIONED = 2400;

function sanitizeProduct(p) {
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  return { ...p, variants, totalStock, sizes: variants.map(v => ({ size: String(v.size), stock: Number(v.stock||0), sku: v.sku, price: Number(v.price||p.price||0) })) };
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(match[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}
function makeTracking(id) { return `SNK-${String(id).padStart(5, '0')}`; }

const resetTokens = new Map();

app.get('/api/health', (_req, res) => res.json({ ok: true, settings: settings() }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users().find(u => u.email === email && bcrypt.compareSync(password, u.password));
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users().find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });
  const list = users();
  if (list.find(u => u.email === email)) return res.status(409).json({ error: 'Cet email est deja utilise.' });
  const newUser = { id: Date.now(), email, password: bcrypt.hashSync(password, 10), role: 'client', firstName: firstName || '', lastName: lastName || '' };
  saveUsers([...list, newUser]);
  const tok = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ token: tok, user: safeUser });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  const user = users().find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'Aucun compte associé à cet email.' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  resetTokens.set(email, { code, expires: Date.now() + 15 * 60 * 1000 });
  res.json({ ok: true, emailSimulation: `[Email simulé] Votre code de réinitialisation : ${code} (valable 15 min)` });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, password } = req.body || {};
  const stored = resetTokens.get(email);
  if (!stored || stored.code !== code || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Code invalide ou expiré.' });
  }
  const list = users();
  const idx = list.findIndex(u => u.email === email);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  list[idx].password = bcrypt.hashSync(password, 10);
  saveUsers(list);
  resetTokens.delete(email);
  res.json({ ok: true });
});

app.patch('/api/users/me', auth, (req, res) => {
  const list = users();
  const idx = list.findIndex(u => String(u.id) === String(req.user.id));
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  const { password: _p, id: _i, role: _r, email: _e, ...patch } = req.body || {};
  list[idx] = { ...list[idx], ...patch };
  saveUsers(list);
  const { password: _pw2, ...safe } = list[idx];
  res.json(safe);
});

app.get('/api/users', auth, allow('admin'), (_req, res) => {
  res.json(users().map(({ password: _pw, ...u }) => u));
});
app.post('/api/users', auth, allow('admin'), (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password et role requis' });
  const list = users();
  if (list.find(u => u.email === email)) return res.status(409).json({ error: 'Email déjà utilisé' });
  const newUser = { id: Date.now(), email, password: bcrypt.hashSync(password, 10), role };
  saveUsers([...list, newUser]);
  const { password: _pw, ...safe } = newUser;
  res.status(201).json(safe);
});
app.patch('/api/users/:id', auth, allow('admin'), (req, res) => {
  const list = users();
  const idx = list.findIndex(u => String(u.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { password: _pw, id: _id, ...patch } = req.body || {};
  list[idx] = { ...list[idx], ...patch };
  saveUsers(list);
  const { password: _pw2, ...safe } = list[idx];
  res.json(safe);
});
app.delete('/api/users/:id', auth, allow('admin'), (req, res) => {
  saveUsers(users().filter(u => String(u.id) !== req.params.id));
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();
  const size = String(req.query.size || '').trim();
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
  const sort = String(req.query.sort || 'featured');
  const promo = String(req.query.promo || '') === 'true';

  let list = products().map(sanitizeProduct);
  if (q) list = list.filter(p => `${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(q));
  if (category) list = list.filter(p => p.category.toLowerCase() === category);
  if (size) list = list.filter(p => p.variants.some(v => String(v.size) === size && Number(v.stock) > 0));
  if (!Number.isNaN(minPrice) && minPrice !== null) list = list.filter(p => Number(p.price) >= minPrice);
  if (!Number.isNaN(maxPrice) && maxPrice !== null) list = list.filter(p => Number(p.price) <= maxPrice);
  if (promo) list = list.filter(p => Number(p.originalPrice) > Number(p.price));
  const badge = String(req.query.badge || '');
  if (badge) list = list.filter(p => p.badge === badge);

  if (sort === 'price_asc') list.sort((a,b)=>a.price-b.price);
  else if (sort === 'price_desc') list.sort((a,b)=>b.price-a.price);
  else if (sort === 'stock_desc') list.sort((a,b)=>b.totalStock-a.totalStock);
  else if (sort === 'newest') list.sort((a,b)=>b.id-a.id);
  else list.sort((a,b)=>Number(b.featured)-Number(a.featured) || b.totalStock-a.totalStock);

  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const p = products().find(x => Number(x.id) === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(sanitizeProduct(p));
});

app.post('/api/products', auth, allow('admin'), (req, res) => {
  const list = products();
  const body = req.body || {};
  const nextId = list.length ? Math.max(...list.map(p=>p.id)) + 1 : 1;
  const variants = Array.isArray(body.variants) ? body.variants : [];
  if (!body.name || !body.category || !variants.length) return res.status(400).json({ error: 'Produit invalide' });
  const product = {
    id: nextId,
    brand: body.brand || 'SneakR',
    name: body.name,
    category: body.category,
    gender: body.gender || body.category,
    price: Number(body.price || 0),
    originalPrice: Number(body.originalPrice || body.price || 0),
    image: body.image || '/images/placeholder.svg',
    description: body.description || '',
    colorway: body.colorway || 'Mixed',
    badge: body.badge || '',
    colors: Array.isArray(body.colors) ? body.colors : [],
    featured: Boolean(body.featured),
    variants: variants.map((v, i) => ({ sku: v.sku || `SKU-${nextId}-${i+1}`, size: String(v.size), stock: Number(v.stock||0), price: Number(v.price || body.price || 0) }))
  };
  list.push(product);
  saveProducts(list);
  res.status(201).json(sanitizeProduct(product));
});

app.patch('/api/products/:id', auth, allow('admin','seller'), (req, res) => {
  const list = products();
  const idx = list.findIndex(p => Number(p.id) === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
  const body = req.body || {};
  const p = list[idx];
  ['brand','name','category','gender','image','description','colorway','badge'].forEach(k => { if (body[k] !== undefined) p[k] = body[k]; });
  if (Array.isArray(body.colors)) p.colors = body.colors;
  ['price','originalPrice'].forEach(k => { if (body[k] !== undefined) p[k] = Number(body[k]); });
  if (body.featured !== undefined) p.featured = Boolean(body.featured);
  if (Array.isArray(body.variants)) {
    p.variants = body.variants.map((v, i) => ({ sku: v.sku || `SKU-${p.id}-${i+1}`, size: String(v.size), stock: Number(v.stock||0), price: Number(v.price || body.price || p.price || 0) }));
  }
  saveProducts(list);
  res.json(sanitizeProduct(p));
});

app.delete('/api/products/:id', auth, allow('admin'), (req, res) => {
  const list = products();
  const next = list.filter(p => Number(p.id) !== Number(req.params.id));
  if (next.length === list.length) return res.status(404).json({ error: 'Produit introuvable' });
  saveProducts(next);
  res.json({ ok: true });
});

app.post('/api/cart/validate', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/orders', auth, (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return res.status(400).json({ error: 'Panier vide' });
  const list = products();
  const normalized = [];
  for (const item of items) {
    const p = list.find(x => Number(x.id) === Number(item.productId));
    if (!p) return res.status(400).json({ error: 'Produit introuvable' });
    const variant = (p.variants || []).find(v => String(v.size) === String(item.size));
    if (!variant) return res.status(400).json({ error: 'Taille introuvable' });
    const qty = Math.max(1, Number(item.qty || 1));
    if (Number(variant.stock) < qty) return res.status(400).json({ error: `${p.name} taille ${variant.size} : stock insuffisant` });
    variant.stock -= qty;
    normalized.push({ productId: p.id, name: p.name, brand: p.brand, size: String(variant.size), qty, unitPrice: Number(variant.price || p.price), lineTotal: Number(variant.price || p.price) * qty });
  }
  saveProducts(list);
  const orderList = orders();
  const id = orderList.length ? Math.max(...orderList.map(o => o.id)) + 1 : 1;
  const total = normalized.reduce((s,i)=>s+i.lineTotal,0);
  const order = {
    id,
    tracking: makeTracking(id),
    userId: req.user.id,
    userEmail: req.user.email,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    shippingStatus: 'preparing',
    shipping: body.shipping || {},
    payment: { method: body.payment?.method || 'Carte bancaire', brand: body.payment?.brand || 'visa', last4: body.payment?.last4 || '4242', fake: true },
    items: normalized,
    total,
    emailSimulation: `Email de confirmation simulé envoyé à ${req.user.email}`
  };
  orderList.push(order);
  saveOrders(orderList);
  res.status(201).json({ ok: true, order });
});

app.get('/api/orders', auth, (req, res) => {
  const list = orders();
  if (req.user.role === 'admin' || req.user.role === 'seller') return res.json(list);
  res.json(list.filter(o => Number(o.userId) === Number(req.user.id)));
});

app.patch('/api/orders/:id', auth, allow('admin','seller'), (req, res) => {
  const list = orders();
  const order = list.find(o => Number(o.id) === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (req.body.status) order.status = req.body.status;
  if (req.body.shippingStatus) order.shippingStatus = req.body.shippingStatus;
  saveOrders(list);
  res.json(order);
});


app.post('/api/reconditioning', (req, res) => {
  const { prenom, email, marque, pointure, etat, message } = req.body || {};
  if (!prenom || !email || !marque || !pointure) return res.status(400).json({ error: 'Prénom, email, marque et pointure sont requis.' });
  const list = reconditioning();
  const entry = { id: Date.now(), prenom, email, marque, pointure, etat: etat || 'bon', message: message || '', status: 'pending', createdAt: new Date().toISOString() };
  list.push(entry);
  saveReconditioning(list);
  res.status(201).json({ ok: true, request: entry });
});

app.get('/api/reconditioning', auth, allow('admin','seller'), (_req, res) => {
  res.json(reconditioning());
});

app.patch('/api/reconditioning/:id', auth, allow('admin','seller'), (req, res) => {
  const list = reconditioning();
  const entry = list.find(r => Number(r.id) === Number(req.params.id));
  if (!entry) return res.status(404).json({ error: 'Demande introuvable' });
  if (req.body.status) entry.status = req.body.status;
  saveReconditioning(list);
  res.json(entry);
});

app.get('/api/reconditioning/stats', (_req, res) => {
  const list = reconditioning();
  const accepted = list.filter(r => r.status === 'accepted').length;
  res.json({
    pending: list.filter(r => r.status === 'pending').length,
    accepted,
    total: list.length,
    reconditionedTotal: BASE_RECONDITIONED + accepted
  });
});

app.get('/api/admin/stats', auth, allow('admin','seller'), (_req, res) => {
  const ps = products().map(sanitizeProduct);
  const os = orders();
  const recond = reconditioning();
  const lastImport = readJson(MAPPING_AUDIT_FILE, null);
  res.json({
    products: ps.length,
    orders: os.length,
    revenue: os.reduce((s,o)=>s+Number(o.total||0),0),
    lowStock: ps.filter(p=>p.totalStock <= 6).length,
    pending: os.filter(o=>o.shippingStatus !== 'delivered').length,
    reconditioningPending: recond.filter(r=>r.status === 'pending').length,
    lastImport: lastImport ? {
      source: lastImport.sources?.[0]?.name || lastImport.mode || 'Inconnu',
      mode: lastImport.mode,
      imported: lastImport.imported,
      importedAt: lastImport.finishedAt,
      counts: lastImport.counts
    } : null
  });
});

app.get('/api/rgpd/export', auth, (req, res) => {
  const user = users().find(u => u.id === req.user.id);
  const userOrders = orders().filter(o => o.userId === req.user.id);
  res.json({
    exportedAt: new Date().toISOString(),
    user: user ? { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } : null,
    orders: userOrders,
    consentStorageKey: 'consent.v2',
    sessionStorageKey: 'token/profile'
  });
});

app.delete('/api/rgpd/delete', auth, (req, res) => {
  const next = orders().filter(o => o.userId !== req.user.id);
  saveOrders(next);
  res.json({ ok: true, message: 'Les donnees de commandes de cet utilisateur ont ete supprimees.' });
});

app.get('/api/reviews/:productId', (req, res) => {
  res.json(reviews().filter(r => String(r.productId) === req.params.productId));
});
app.post('/api/reviews/:productId', auth, (req, res) => {
  const { rating, comment } = req.body || {};
  if (!rating || Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ error: 'Note invalide (1-5).' });
  const list = reviews();
  if (list.find(r => String(r.productId) === req.params.productId && String(r.userId) === String(req.user.id))) {
    return res.status(409).json({ error: 'Vous avez deja note ce produit.' });
  }
  const review = { id: Date.now(), productId: Number(req.params.productId), userId: req.user.id, userEmail: req.user.email, rating: Number(rating), comment: String(comment || '').trim(), createdAt: new Date().toISOString() };
  list.push(review);
  saveReviews(list);
  res.status(201).json(review);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
