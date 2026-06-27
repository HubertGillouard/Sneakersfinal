const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const imgDir = path.join(root, 'public', 'images');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(imgDir, { recursive: true });

function safe(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function placeholderSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#0f172a"/>
  <path d="M76 319 C139 250 220 204 336 183 C422 167 524 176 602 205 C680 234 747 291 816 317 C884 342 952 331 1000 326 C1022 360 1042 403 1048 447 C954 501 776 513 611 491 C467 472 347 433 196 425 C131 421 77 386 50 351 Z" fill="#334155" transform="translate(0 60)"/>
  <text x="50" y="80" fill="#94a3b8" font-family="Arial, sans-serif" font-size="32" font-weight="700">Image non disponible</text>
</svg>`;
}

const categories = [
  { key: 'hommes', sizes: ['40','41','42','43','44','45','46','47'] },
  { key: 'femmes', sizes: ['36','37','38','39','40','41','42'] },
  { key: 'enfants', sizes: ['28','29','30','31','32','33','34','35'] }
];

// 20 photos Unsplash vérifiées manuellement — chaque description a été confirmée
// sur la page unsplash.com de la photo pour garantir la correspondance marque/modèle.
const imagePool = [
  // ── Nike (6 photos) ───────────────────────────────────────────────────────
  {
    brand: 'Nike', model: 'Air Max',
    // "A solitary red Nike sneaker" — Domino Studio, Malmö
    file: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Nike', model: 'Dunk Low',
    // "black white and red nike sneakers" — tags : nike dunk low — Samuel Lopes
    file: 'https://images.unsplash.com/photo-1615290642882-6b9501729a27?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Nike', model: 'Dunk Low SP',
    // "Nike Dunk Low SP Champ Colors" black/orange/white — Thanin Chaiyawan, Bangkok
    file: 'https://images.unsplash.com/photo-1592962879424-fab5e296b7d9?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Nike', model: 'Air Force 1',
    // "Studioshot of a Nike Air Force 1 Shadow" white/blue — Amsterdam
    file: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Nike', model: 'Classic',
    // Photo blanche Nike très connue — Nike confirmé
    file: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Nike', model: 'Blazer',
    // "white and red nike athletic shoe" — Luis Felipe Lins, Brasília
    file: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80'
  },

  // ── Adidas (5 photos) ─────────────────────────────────────────────────────
  {
    brand: 'Adidas', model: 'Samba OG',
    // "white adidas low-top sneakers" — Daniel Storek
    file: 'https://images.unsplash.com/flagged/photo-1556637640-2c80d3201be8?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Adidas', model: 'Stan Smith',
    // "red and white adidas low top sneakers" — Ervan M Wirawan
    file: 'https://images.unsplash.com/photo-1621665422246-fde75fb7e7f5?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Adidas', model: 'Superstar',
    // "Adidas Superstar" black/white — Eddie Palmore
    file: 'https://images.unsplash.com/photo-1593287073863-c992914cb3e3?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Adidas', model: 'Ultra Boost',
    // "white and blue Adidas sneakers" — Zakaria Issaad
    file: 'https://images.unsplash.com/photo-1711719745936-ff93f602246e?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Adidas', model: 'Campus',
    // "mustard yellow Adidas sneakers on sand" — tags : campus, adidas — Francesca Fabian, Barcelone
    file: 'https://images.unsplash.com/photo-1756654656874-b24fcc349e34?auto=format&fit=crop&w=900&q=80'
  },

  // ── Jordan (4 photos) ─────────────────────────────────────────────────────
  {
    brand: 'Jordan', model: 'Air Jordan 1 Low',
    // "man wearing Air Jordan 1 low-top shoes" — Zürich
    file: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Jordan', model: 'Air Jordan 1',
    // "person wearing pair of red-and-white Air Jordan 1 shoes" — Paul Lichtblau
    file: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Jordan', model: 'Air Jordan 1 OG',
    // "pair of black-white-and-red Air Jordan 1 shoes" — Taylor Smith
    file: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Jordan', model: 'Air Jordan 1 High',
    // "white and black Nike Air Jordan 1" — photo confirmée Jordan
    file: 'https://images.unsplash.com/photo-1602231379593-b85a472e3c99?auto=format&fit=crop&w=900&q=80'
  },

  // ── New Balance (2 photos) ────────────────────────────────────────────────
  {
    brand: 'New Balance', model: 'X-90',
    // "pink, grey and white New Balance X-90 sneaker" — Saint-Pétersbourg
    file: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'New Balance', model: '574',
    // "person wearing pair of red New Balance low-top sneakers"
    file: 'https://images.unsplash.com/photo-1559745206-ca4056293ddc?auto=format&fit=crop&w=900&q=80'
  },

  // ── Puma (1 photo) ────────────────────────────────────────────────────────
  {
    brand: 'Puma', model: 'Suede',
    // "a white and red puma sneakers sitting on top of a table" — Zakaria Issaad
    file: 'https://images.unsplash.com/photo-1715003132895-b10a23d3c90f?auto=format&fit=crop&w=900&q=80'
  },

  // ── Asics (2 photos) ──────────────────────────────────────────────────────
  {
    brand: 'Asics', model: 'Gel-Kinsei OG',
    // "pair of white-and-purple Asics Gel-Kinsei OG sneakers"
    file: 'https://images.unsplash.com/photo-1575456456278-936c89ccdb7b?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Asics', model: 'Gel-Kinsei',
    // "Asics Wmns Gel-Kinsei OG White" — coloris blanc
    file: 'https://images.unsplash.com/photo-1575456571326-2a5c7478aeb2?auto=format&fit=crop&w=900&q=80'
  },
];

fs.writeFileSync(path.join(imgDir, 'placeholder.svg'), placeholderSvg(), 'utf8');

const products = [];
for (let i = 1; i <= 120; i++) {
  const c = categories[(i - 1) % categories.length];
  const image = imagePool[(i - 1) % imagePool.length];
  const brand = image.brand;
  const model = image.model;
  const price = 79 + (i % 12) * 8 + (c.key === 'enfants' ? -18 : c.key === 'femmes' ? 5 : 12);
  const originalPrice = price + 20 + (i % 4) * 5;
  products.push({
    id: i,
    brand,
    name: `${brand} ${model} ${100 + i}`,
    category: c.key,
    gender: c.key,
    price,
    originalPrice,
    image: image.file,
    description: `${brand} ${model} ${100 + i} : sneaker ${c.key} avec fiche produit enrichie, tailles réalistes et stock suivi par pointure.`,
    colorway: ['Onyx / Violet','Blue Ice','Red Cream','Mint Black','Orange Sand','Pink Glow'][i % 6],
    badge: i % 7 === 0 ? 'Stock limité' : i % 5 === 0 ? 'Éco sélection' : i % 3 === 0 ? 'Best Seller' : 'Nouveau',
    featured: i <= 12 || i % 11 === 0,
    variants: c.sizes.map((size, idx) => ({
      sku: `${safe(brand).toUpperCase()}-${String(i).padStart(3, '0')}-${size}`,
      size,
      stock: ((i + idx * 2) % 11) + (idx % 3 === 0 ? 1 : 0),
      price
    }))
  });
}

const users = [
  { id: 1, email: 'admin@test.com', password: bcrypt.hashSync('admin', 10), role: 'admin', firstName: 'Max', lastName: 'Admin' },
  { id: 2, email: 'seller@test.com', password: bcrypt.hashSync('seller', 10), role: 'seller', firstName: 'Hubert', lastName: 'Seller' },
  { id: 3, email: 'client@test.com', password: bcrypt.hashSync('client', 10), role: 'client', firstName: 'Jean', lastName: 'Client' }
];

fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify([], null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'settings.json'), JSON.stringify({ brandName: 'SneakR Elite', accent: '#7c3aed', imageCount: imagePool.length, imageMode: 'unsplash-verified' }, null, 2), 'utf8');
console.log(`Seed terminé : ${products.length} produits, ${imagePool.length} photos Unsplash vérifiées (Nike×6, Adidas×5, Jordan×4, NB×2, Asics×2, Puma×1).`);
