import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  profile, login, logout, register, forgotPassword, resetPassword,
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getUsers, createUser, updateUser, deleteUser, updateProfile,
  getOrders, updateOrder, checkout, getAdminStats, getMappingSources, refreshWebMapping, exportData, deleteData,
  getReviews, addReview,
  resolveImg, money, getCart, addCart, setQty, removeCart, clearCart, cartCount,
  getConsent, setConsent, getWishlist, toggleWishlist, isWishlisted
} from './api/index.js';

function useSession() {
  const [user, setUser] = React.useState(profile());
  return { user, setUser };
}
function FooterNewsletter() {
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(false);
  function subscribe() {
    if (!email) return;
    try { const list = JSON.parse(localStorage.getItem('nl_subscribers') || '[]'); if (!list.includes(email)) { list.push(email); localStorage.setItem('nl_subscribers', JSON.stringify(list)); } } catch {}
    setDone(true);
  }
  if (done) return <span className="footer-nl-done">Merci !</span>;
  return <div className="footer-nl"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre email" type="email" /><button onClick={subscribe}>S'inscrire</button></div>;
}
function Layout({ user, setUser, children, cartTotal }) {
  const navigate = useNavigate();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="logo">SneakR <span>Elite</span></Link>
        <nav className="nav">
          <Link to="/catalogue">Catalogue</Link>
          <Link to="/cart">Panier <span className="pill">{cartTotal}</span></Link>
          {user && <Link to="/account">Compte</Link>}
          {user && (user.role === 'admin' || user.role === 'seller') && <Link to="/admin">Back-office</Link>}
          <Link to="/eco">Eco</Link>
          <Link to="/rgpd">RGPD</Link>
          {!user ? <Link className="cta" to="/login">Connexion</Link> : <button className="ghost" onClick={() => { logout(); setUser(null); navigate('/'); }}>Déconnexion</button>}
        </nav>
      </header>
      {children}
      <footer className="footer">
        <div className="footer-row">
          <div className="footer-nl-block">
            <span>Newsletter SneakR</span>
            <FooterNewsletter />
          </div>
          <div className="footer-links">
            <Link to="/mentions-legales">Mentions légales</Link>
            <span>&middot;</span>
            <Link to="/rgpd">RGPD</Link>
            <span>&middot;</span>
            <Link to="/eco">Eco</Link>
          </div>
        </div>
        <div className="footer-copy">
          <span>SneakR &copy; 2025</span>
          <button className="ghost ck-footer-btn" onClick={() => _showBanner && _showBanner()}>&#127850; Gerer les cookies</button>
        </div>
      </footer>
    </div>
  );
}
let _showBanner = null;
function CookieBanner() {
  const saved = getConsent();
  const [visible, setVisible] = React.useState(!saved);
  const [analytics, setAnalytics] = React.useState(!!(saved && saved.analytics));
  const [marketing, setMarketing] = React.useState(!!(saved && saved.marketing));
  React.useEffect(() => { _showBanner = () => setVisible(true); return () => { _showBanner = null; }; }, []);
  if (!visible) return null;
  function save(a, m) {
    setConsent(a, m);
    setVisible(false);
    const ts = new Date().toLocaleString('fr-FR');
    console.group('%c🍪 SneakR — Cookies (RGPD)', 'background:#7c3aed;color:#fff;padding:4px 10px;border-radius:4px;font-weight:700;');
    console.log('%c✅ Essentiels   %cToujours actifs', 'color:#047857;font-weight:700;', 'color:#64748b;');
    console.log(a ? '%c✅ Analytiques  %cActifs' : '%c❌ Analytiques  %cRefusés', a ? 'color:#047857;font-weight:700;' : 'color:#b91c1c;font-weight:700;', 'color:#64748b;');
    console.log(m ? '%c✅ Marketing    %cActifs' : '%c❌ Marketing    %cRefusés', m ? 'color:#047857;font-weight:700;' : 'color:#b91c1c;font-weight:700;', 'color:#64748b;');
    console.log('%cDernier consentement : ' + ts, 'color:#64748b;font-style:italic;');
    console.groupEnd();
  }
  return (
    <div className="ck-banner">
      <div className="ck-left">
        <div className="ck-body">
          <strong>Vos préférences cookies</strong>
          <p>Conformément au <strong>RGPD</strong>, gérez votre consentement.</p>
          <div className="ck-toggles">
            <label className="ck-toggle"><input type="checkbox" checked disabled onChange={() => {}} /><span>Essentiels</span><small className="ck-req">Obligatoires</small></label>
            <label className="ck-toggle"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /><span>Analytiques</span></label>
            <label className="ck-toggle"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /><span>Marketing</span></label>
          </div>
        </div>
      </div>
      <div className="ck-actions">
        <button onClick={() => save(true, true)}>Tout accepter</button>
        <button className="secondary" onClick={() => save(analytics, marketing)}>Mes choix</button>
        <button className="secondary" onClick={() => save(false, false)}>Tout refuser</button>
      </div>
    </div>
  );
}
function Hero() {
  return <section className="hero">
    <div>
      <p className="eyebrow">SneakR</p>
      <h1>La boutique sneakers premium.</h1>
      <p className="lead">Catalogue riche, stock par pointure, authentification, suivi de commande, RGPD et back-office.</p>
      <div className="row gap">
        <Link className="btn-dark" to="/catalogue">Découvrir</Link>
        <Link className="btn-light" to="/login">Tester les rôles</Link>
      </div>
    </div>
    <div className="hero-card">
      <div className="hero-metric"><span>100</span><small>références</small></div>
      <div className="hero-metric"><span>3</span><small>rôles</small></div>
      <div className="hero-metric"><span>1</span><small>checkout complet</small></div>
    </div>
  </section>;
}
function Home({ refreshCart }) {
  const [featured, setFeatured] = React.useState([]);
  React.useEffect(() => { getProducts({ sort: 'featured' }).then(data => setFeatured(data.slice(0, 8))); }, []);
  return <main className="page stack-xl">
    <Hero />
    <section className="section-head"><div><p className="eyebrow">Sélection</p><h2>Modèles mis en avant</h2></div><Link to="/catalogue" className="text-link">Voir tout</Link></section>
    <section className="grid products">{featured.map(p => <ProductCard key={p.id} product={p} refreshCart={refreshCart} />)}</section>
  </main>;
}
function ProductCard({ product, refreshCart }) {
  const available = product.sizes?.find(s => s.stock > 0)?.size || product.variants?.find(v => v.stock > 0)?.size;
  const [wishlisted, setWishlisted] = React.useState(() => isWishlisted(product.id));
  return <article className="product-card">
    <div className="image-wrap">
      <img src={resolveImg(product.image || product.link)} alt={product.name} />
      <button className="heart-btn" title={wishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={e => { e.preventDefault(); const l = toggleWishlist(product); setWishlisted(l.some(p => p.id === product.id)); }}>{wishlisted ? '❤️' : '🤍'}</button>
    </div>
    <div className="product-content">
      <p className="muted">{product.brand} · {product.category}</p>
      <h3>{product.name}</h3>
      <p className="price-line"><strong>{money(product.price)}</strong> <span>{money(product.originalPrice)}</span></p>
      <p className="muted">Stock total : {product.totalStock}</p>
      <div className="row gap wrap">
        <Link to={`/product/${product.id}`} className="btn-light small">Voir</Link>
        <button className="small" disabled={!available} onClick={() => { if (!available) return; addCart(product, available, 1); refreshCart(); }}>Ajout rapide</button>
      </div>
    </div>
  </article>;
}
function Catalogue({ refreshCart }) {
  const [filters, setFilters] = React.useState({ q:'', category:'', size:'', minPrice:'', maxPrice:'', sort:'featured' });
  const [items, setItems] = React.useState([]);
  const load = React.useCallback(() => getProducts(filters).then(setItems), [filters]);
  React.useEffect(() => { load(); }, [load]);
  return <main className="page stack-lg">
    <section className="panel">
      <div className="section-head no-border"><div><p className="eyebrow">Catalogue</p><h1>Trouvez la bonne paire</h1></div><p className="muted">Plus de 100 références, filtrables par taille, prix et catégorie.</p></div>
      <div className="filters">
        <input value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))} placeholder="Rechercher une sneaker" />
        <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}><option value="">Toutes catégories</option><option value="hommes">Hommes</option><option value="femmes">Femmes</option><option value="enfants">Enfants</option></select>
        <select value={filters.size} onChange={e=>setFilters(f=>({...f,size:e.target.value}))}><option value="">Toutes tailles</option>{['28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45'].map(s=><option key={s} value={s}>{s}</option>)}</select>
        <input type="number" value={filters.minPrice} onChange={e=>setFilters(f=>({...f,minPrice:e.target.value}))} placeholder="Prix min" />
        <input type="number" value={filters.maxPrice} onChange={e=>setFilters(f=>({...f,maxPrice:e.target.value}))} placeholder="Prix max" />
        <select value={filters.sort} onChange={e=>setFilters(f=>({...f,sort:e.target.value}))}><option value="featured">Mis en avant</option><option value="newest">Nouveautés</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="stock_desc">Plus de stock</option></select>
        <button onClick={load}>Appliquer</button>
      </div>
    </section>
    <section className="grid products">{items.map(p => <ProductCard key={p.id} product={p} refreshCart={refreshCart} />)}</section>
  </main>;
}
function ProductDetail({ refreshCart }) {
  const { id } = useParams();
  const [product, setProduct] = React.useState(null);
  const [size, setSize] = React.useState('');
  const [qty, setQtyLocal] = React.useState(1);
  const [msg, setMsg] = React.useState('');
  const [wishlisted, setWishlisted] = React.useState(false);
  const [reviewList, setReviewList] = React.useState([]);
  const [reviewForm, setReviewForm] = React.useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = React.useState('');
  const currentUser = profile();
  React.useEffect(() => {
    getProduct(id).then(p => {
      setProduct(p);
      setWishlisted(isWishlisted(p.id));
      const first = p.sizes.find(s => s.stock > 0) || p.sizes[0];
      setSize(first?.size || '');
    });
    getReviews(id).then(setReviewList).catch(() => {});
  }, [id]);
  if (!product) return <main className="page"><section className="panel">Chargement...</section></main>;
  const selected = product.sizes.find(s => String(s.size) === String(size));
  const avgRating = reviewList.length ? (reviewList.reduce((s,r)=>s+r.rating,0)/reviewList.length).toFixed(1) : null;
  return <main className="page stack-lg">
    <section className="detail-grid">
      <div className="panel image-panel"><img className="detail-image" src={resolveImg(product.image || product.link)} alt={product.name} /></div>
      <div className="panel stack-md">
        <p className="eyebrow">{product.brand} · {product.category}</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="row gap wrap">
          <span className="chip">{product.colorway}</span>
          <span className="chip">Stock total {product.totalStock}</span>
          {avgRating && <span className="chip">{'⭐'.repeat(Math.round(Number(avgRating)))} {avgRating}/5 ({reviewList.length})</span>}
        </div>
        <p className="price-line big"><strong>{money(product.price)}</strong> <span>{money(product.originalPrice)}</span></p>
        <div className="stack-sm">
          <label>Taille</label>
          <div className="sizes">{product.sizes.map(s => <button key={s.size} className={`size-btn ${String(size)===String(s.size)?'active':''}`} disabled={s.stock<=0} onClick={()=>setSize(s.size)}>{s.size}<small>{s.stock>0?`${s.stock} dispo`:'rupture'}</small></button>)}</div>
        </div>
        <div className="row gap wrap">
          <input className="qty" type="number" min="1" max={selected?.stock || 1} value={qty} onChange={e=>setQtyLocal(e.target.value)} />
          <button disabled={!selected || selected.stock <= 0} onClick={() => { addCart(product, size, Number(qty)); refreshCart(); setMsg(`Ajouté au panier en ${size}`); }}>Ajouter au panier</button>
          <button className="secondary" style={{padding:'11px 14px'}} onClick={() => { const l = toggleWishlist(product); setWishlisted(l.some(p=>p.id===product.id)); }}>{wishlisted ? '❤️ Favoris' : '🤍 Favoris'}</button>
        </div>
        {msg && <p className="success">{msg}</p>}
      </div>
    </section>
    <section className="panel stack-md">
      <h2>Avis clients {reviewList.length > 0 && <span className="chip" style={{fontSize:'.82rem',verticalAlign:'middle'}}>({reviewList.length})</span>}</h2>
      {reviewList.length === 0 && <p className="muted">Aucun avis pour le moment.</p>}
      <div className="stack-md">{reviewList.map(r => <div key={r.id} className="review-card"><div className="row between wrap"><span>{'⭐'.repeat(r.rating)}</span><span className="muted" style={{fontSize:'.8rem'}}>{r.userEmail} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span></div>{r.comment && <p style={{margin:'6px 0 0'}}>{r.comment}</p>}</div>)}</div>
      {currentUser ? <div className="stack-sm review-form">
        <strong>Laisser un avis</strong>
        <select value={reviewForm.rating} onChange={e=>setReviewForm(f=>({...f,rating:Number(e.target.value)}))}>
          <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
          <option value={4}>⭐⭐⭐⭐ Tres bien</option>
          <option value={3}>⭐⭐⭐ Bien</option>
          <option value={2}>⭐⭐ Moyen</option>
          <option value={1}>⭐ Mauvais</option>
        </select>
        <textarea value={reviewForm.comment} onChange={e=>setReviewForm(f=>({...f,comment:e.target.value}))} placeholder="Votre commentaire (optionnel)" style={{minHeight:'70px'}} />
        <button className="secondary" style={{alignSelf:'flex-start'}} onClick={async()=>{ setReviewMsg(''); try { const r = await addReview(id, reviewForm); setReviewList(prev=>[...prev,r]); setReviewForm({rating:5,comment:''}); setReviewMsg('Avis publié !'); } catch(e){ setReviewMsg(e.message); } }}>Publier mon avis</button>
        {reviewMsg && <p className={reviewMsg.includes('!') ? 'success' : 'error'}>{reviewMsg}</p>}
      </div> : <p className="muted" style={{fontSize:'.9rem'}}><Link to="/login" className="text-link">Connectez-vous</Link> pour laisser un avis.</p>}
    </section>
  </main>;
}
function CartPage({ refreshCart }) {
  const navigate = useNavigate();
  const [items, setItems] = React.useState(getCart());
  const total = items.reduce((s,i)=>s+Number(i.price)*Number(i.qty),0);
  const sync = () => { const next = getCart(); setItems(next); refreshCart(); };
  return <main className="page stack-lg">
    <section className="panel"><h1>Panier</h1></section>
    {!items.length ? <section className="panel"><p>Ton panier est vide.</p></section> : <section className="cart-layout">
      <div className="stack-md">{items.map(item => <div className="cart-item panel" key={`${item.productId}-${item.size}`}>
        <img src={resolveImg(item.image)} alt={item.name} />
        <div><p className="muted">{item.brand}</p><h3>{item.name}</h3><p>Taille {item.size}</p></div>
        <input className="qty" type="number" min="1" value={item.qty} onChange={e=>{ setQty(item.productId, item.size, e.target.value); sync(); }} />
        <p><strong>{money(Number(item.price)*Number(item.qty))}</strong></p>
        <button className="secondary" onClick={()=>{ removeCart(item.productId, item.size); sync(); }}>Supprimer</button>
      </div>)}</div>
      <aside className="panel sticky"><h2>Récapitulatif</h2><p className="summary-line"><span>Sous-total</span><strong>{money(total)}</strong></p><p className="summary-line"><span>Livraison</span><strong>Offerte</strong></p><p className="summary-line total"><span>Total</span><strong>{money(total)}</strong></p><div className="stack-sm"><button onClick={()=>navigate('/checkout')}>Passer au paiement</button><button className="secondary" onClick={()=>{ clearCart(); sync(); }}>Vider le panier</button></div></aside>
    </section>}
  </main>;
}
function CheckoutPage({ user, refreshCart }) {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ name:'Jean Client', address:'10 rue de Paris', city:'Paris', zip:'75000', method:'Carte bancaire' });
  const [status, setStatus] = React.useState('');
  const items = getCart();
  const total = items.reduce((s,i)=>s+Number(i.price)*Number(i.qty),0);
  if (!user) return <Navigate to="/login" replace />;
  return <main className="page stack-lg">
    <section className="panel"><h1>Finaliser la commande</h1></section>
    <section className="checkout-layout">
      <div className="panel stack-md">
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nom complet" />
        <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Adresse" />
        <div className="row gap"><input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Ville" /><input value={form.zip} onChange={e=>setForm(f=>({...f,zip:e.target.value}))} placeholder="Code postal" /></div>
        <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}><option>Carte bancaire</option><option>PayPal simulé</option><option>Apple Pay simulé</option></select>
        <div className="fake-card"><div><span>Carte de démonstration</span><strong>4242 4242 4242 4242</strong></div><small>Exp 12/30 · CVV 123</small></div>
        <button disabled={!items.length} onClick={async ()=>{
          try {
            const result = await checkout({ items, shipping: form, payment: { method: form.method, brand: 'visa', last4: '4242' } });
            clearCart(); refreshCart();
            navigate('/order-confirm', { state: { order: result.order } });
          } catch (e) { setStatus(e.message); }
        }}>Confirmer et payer</button>
        {status && <p className={status.includes('confirmée') ? 'success' : 'error'}>{status}</p>}
      </div>
      <aside className="panel sticky"><h2>Résumé</h2>{items.map(i => <p key={`${i.productId}-${i.size}`} className="summary-line"><span>{i.name} · {i.size} · x{i.qty}</span><strong>{money(Number(i.price)*Number(i.qty))}</strong></p>)}<p className="summary-line total"><span>Total</span><strong>{money(total)}</strong></p></aside>
    </section>
  </main>;
}
function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('client@test.com');
  const [password, setPassword] = React.useState('client');
  const [error, setError] = React.useState('');
  return <main className="page"><section className="panel auth-panel stack-md">
    <p className="eyebrow">Authentification</p><h1>Connecte-toi selon le rôle à démontrer</h1>
    <div className="demo-accounts"><span>admin@test.com / admin</span><span>vendeur : seller@test.com / seller</span><span>client@test.com / client</span></div>
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" />
    <button onClick={async ()=>{ try { const u = await login(email, password); setUser(u); navigate('/'); } catch (e) { setError(e.message); } }}>Se connecter</button>
    {error && <p className="error">{error}</p>}
    <div className="row gap wrap" style={{fontSize:'.9rem'}}>
      <Link to="/forgot-password" className="text-link">Mot de passe oublié ?</Link>
      <span style={{color:'#94a3b8'}}>·</span>
      <Link to="/register" className="text-link">Créer un compte</Link>
    </div>
  </section></main>;
}
function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [simulation, setSimulation] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [error, setError] = React.useState('');
  return <main className="page"><section className="panel auth-panel stack-md">
    <p className="eyebrow">Mot de passe oublié</p>
    {step === 1 && <>
      <h1>Réinitialiser le mot de passe</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre email" type="email" />
      <button onClick={async()=>{ setError(''); try { const r = await forgotPassword(email); setSimulation(r.emailSimulation); setStep(2); } catch(e){ setError(e.message); } }}>Envoyer le code</button>
      {error && <p className="error">{error}</p>}
      <Link to="/login" className="text-link" style={{fontSize:'.9rem'}}>Retour à la connexion</Link>
    </>}
    {step === 2 && <>
      <h1>Nouveau mot de passe</h1>
      {simulation && <div className="code-box" style={{fontSize:'.85rem'}}>{simulation}</div>}
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code reçu" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nouveau mot de passe" />
      <button onClick={async()=>{ setError(''); try { await resetPassword(email, code, password); setMsg('Mot de passe mis à jour.'); setTimeout(()=>navigate('/login'), 1800); } catch(e){ setError(e.message); } }}>Confirmer</button>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </>}
  </section></main>;
}
function AccountPage({ user }) {
  const [orders, setOrders] = React.useState([]);
  const [exported, setExported] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [profileForm, setProfileForm] = React.useState({ firstName: user.firstName || '', lastName: user.lastName || '' });
  const [profileMsg, setProfileMsg] = React.useState('');
  const [wishlist, setWishlist] = React.useState(getWishlist());
  React.useEffect(() => { getOrders().then(setOrders); }, []);
  return <main className="page stack-lg">
    <section className="panel stack-md">
      <h1>Mon compte</h1>
      <p className="muted">{user.email} · rôle <strong>{user.role}</strong></p>
      <div className="form-grid">
        <input value={profileForm.firstName} onChange={e=>setProfileForm(f=>({...f,firstName:e.target.value}))} placeholder="Prénom" />
        <input value={profileForm.lastName} onChange={e=>setProfileForm(f=>({...f,lastName:e.target.value}))} placeholder="Nom" />
      </div>
      <button className="secondary" style={{alignSelf:'flex-start'}} onClick={async()=>{ try{ await updateProfile(profileForm); setProfileMsg('Profil mis à jour.'); }catch(e){ setProfileMsg(e.message); } }}>Mettre à jour le profil</button>
      {profileMsg && <p className="success">{profileMsg}</p>}
    </section>
    {wishlist.length > 0 && <section className="panel stack-md">
      <div className="section-head no-border"><div><p className="eyebrow">Favoris</p><h2>Ma liste de souhaits</h2></div></div>
      <div className="grid products">{wishlist.map(p => <article key={p.id} className="product-card">
        <div className="image-wrap"><img src={resolveImg(p.image)} alt={p.name} /></div>
        <div className="product-content">
          <p className="muted">{p.brand} · {p.category}</p>
          <h3>{p.name}</h3>
          <p className="price-line"><strong>{money(p.price)}</strong></p>
          <div className="row gap">
            <Link to={`/product/${p.id}`} className="btn-light small">Voir</Link>
            <button className="secondary small" onClick={()=>{ toggleWishlist(p); setWishlist(getWishlist()); }}>Retirer</button>
          </div>
        </div>
      </article>)}</div>
    </section>}
    <section className="panel stack-md">
      <div className="section-head no-border"><div><p className="eyebrow">Commandes</p><h2>Historique et suivi</h2></div></div>
      {!orders.length ? <p className="muted">Aucune commande.</p> : orders.map(order => <div key={order.id} className="order-card"><div className="row between wrap"><strong>Commande #{order.id}</strong><span className="chip">{order.tracking}</span></div><p className="muted">{new Date(order.createdAt).toLocaleString('fr-FR')} · {order.status} · livraison {order.shippingStatus}</p><ul>{order.items.map((i,idx)=><li key={idx}>{i.name} · taille {i.size} · x{i.qty}</li>)}</ul><p><strong>{money(order.total)}</strong></p></div>)}
    </section>
    <section className="panel stack-md">
      <div className="row gap wrap">
        <button onClick={async ()=>setExported(await exportData())}>Exporter mes données</button>
        <button className="secondary" onClick={async ()=>{ const result = await deleteData(); setMessage(result.message); setOrders([]); }}>Supprimer mes données de commande</button>
      </div>
      {message && <p className="success">{message}</p>}
      {exported && <pre className="code-box">{JSON.stringify(exported, null, 2)}</pre>}
    </section>
  </main>;
}
function AdminPage({ user }) {
  const adminTabs = [
    { id:'dashboard', label:'Dashboard' },
    { id:'users', label:'Utilisateurs' },
    { id:'products', label:'Produits' },
    { id:'orders', label:'Commandes' },
    { id:'catalogue', label:'Catalogue' },
    { id:'rgpd', label:'RGPD' },
  ];
  const sellerTabs = [
    { id:'products', label:'Produits' },
    { id:'stocks', label:'Stocks' },
    { id:'orders', label:'Commandes' },
  ];
  const tabs = user.role === 'admin' ? adminTabs : sellerTabs;
  const [tab, setTab] = React.useState(tabs[0].id);
  const [stats, setStats] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [orderList, setOrderList] = React.useState([]);
  const [userList, setUserList] = React.useState([]);
  const [msg, setMsg] = React.useState('');
  const [mappingInfo, setMappingInfo] = React.useState(null);
  const [mappingBusy, setMappingBusy] = React.useState(false);
  const [draft, setDraft] = React.useState({ brand:'Nike', name:'Air Max Demo', category:'hommes', price:129, image:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80', description:'Sneaker Nike Air Max.', variantsText:'40:4,41:5,42:6' });
  const [userDraft, setUserDraft] = React.useState({ email:'', password:'', role:'client' });

  const load = React.useCallback(async () => {
    const [s, p, o, m] = await Promise.all([getAdminStats(), getProducts({ sort:'newest' }), getOrders(), getMappingSources()]);
    setStats(s); setItems(p.slice(0,18)); setOrderList(o); setMappingInfo(m);
    if (user.role === 'admin') getUsers().then(setUserList).catch(() => {});
  }, [user.role]);
  React.useEffect(() => { load(); }, [load]);

  if (!user || !['admin','seller'].includes(user.role)) return <Navigate to="/" replace />;

  function updateLocalProduct(id, patch) { setItems(list => list.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function updateLocalStock(id, idx, stock) { setItems(list => list.map(x => x.id !== id ? x : { ...x, sizes: x.sizes.map((z,i)=>i===idx?{...z,stock:Number(stock)}:z) })); }
  function updateLocalSize(id, idx, size) { setItems(list => list.map(x => x.id !== id ? x : { ...x, sizes: x.sizes.map((z,i)=>i===idx?{...z,size:String(size)}:z) })); }
  function addLocalVariant(id) { setItems(list => list.map(x => x.id !== id ? x : { ...x, sizes: [...x.sizes, { size:'42', stock:1, price:x.price }] })); }
  function removeLocalVariant(id, idx) { setItems(list => list.map(x => x.id !== id ? x : { ...x, sizes: x.sizes.filter((_,i)=>i!==idx) })); }
  async function saveMappedProduct(p) {
    try {
      await updateProduct(p.id, { brand:p.brand, name:p.name, category:p.category, gender:p.category, image:p.image, description:p.description, price:p.price, variants:p.sizes.map(v=>({ size:v.size, stock:v.stock, price:p.price })) });
      setMsg(`Produit #${p.id} sauvegardé.`); load();
    } catch(e) { setMsg(e.message); }
  }

  return <main className="page bo-layout">
    <aside className="bo-sidebar panel">
      <p className="eyebrow">{user.role === 'admin' ? 'Administrateur' : 'Vendeur'}</p>
      <nav className="bo-nav">
        {tabs.map(t => <button key={t.id} className={`bo-tab${tab===t.id?' active':''}`} onClick={()=>{ setMsg(''); setTab(t.id); }}>{t.label}</button>)}
      </nav>
    </aside>
    <div className="bo-content stack-lg">
      {msg && <p className="success">{msg}</p>}

      {tab === 'dashboard' && <section className="panel stack-md">
        <h1>Dashboard</h1>
        {stats && <div className="stats-grid"><div className="stat"><span>Produits</span><strong>{stats.products}</strong></div><div className="stat"><span>Commandes</span><strong>{stats.orders}</strong></div><div className="stat"><span>CA</span><strong>{money(stats.revenue)}</strong></div><div className="stat"><span>Stock faible</span><strong>{stats.lowStock}</strong></div><div className="stat"><span>Livraisons en cours</span><strong>{stats.pending}</strong></div></div>}
        {mappingInfo && <div className="mapping-summary"><div><strong>Catalogue :</strong> {mappingInfo.lastImport?.imported || 0} produit(s) actif(s).</div><div><strong>Sources :</strong> {mappingInfo.sources.map(s=>s.name).join(', ') || '—'}</div></div>}
      </section>}

      {tab === 'users' && <section className="panel stack-md">
        <h1>Utilisateurs</h1>
        <div className="user-list">{userList.map(u => <div key={u.id} className="user-row">
          <span>{u.email}</span>
          <select value={u.role} onChange={async e=>{ try { await updateUser(u.id,{ role:e.target.value }); setMsg(`Rôle de ${u.email} mis à jour.`); load(); } catch(ex){ setMsg(ex.message); } }}><option value="client">client</option><option value="seller">seller</option><option value="admin">admin</option></select>
          <button className="secondary" onClick={async ()=>{ if(!window.confirm(`Supprimer ${u.email} ?`)) return; try { await deleteUser(u.id); setMsg(`${u.email} supprimé.`); load(); } catch(ex){ setMsg(ex.message); } }}>Supprimer</button>
        </div>)}</div>
        <h2>Créer un compte</h2>
        <div className="form-grid">
          <input value={userDraft.email} onChange={e=>setUserDraft(d=>({...d,email:e.target.value}))} placeholder="Email" type="email" />
          <input value={userDraft.password} onChange={e=>setUserDraft(d=>({...d,password:e.target.value}))} placeholder="Mot de passe" type="password" />
          <select value={userDraft.role} onChange={e=>setUserDraft(d=>({...d,role:e.target.value}))}><option value="client">client</option><option value="seller">seller</option><option value="admin">admin</option></select>
        </div>
        <button onClick={async ()=>{ try { await createUser(userDraft); setMsg(`Compte ${userDraft.email} créé.`); setUserDraft({ email:'', password:'', role:'client' }); load(); } catch(ex){ setMsg(ex.message); } }}>Créer le compte</button>
      </section>}

      {tab === 'products' && <>
        {user.role === 'admin' && <section className="panel stack-md">
          <h2>Créer un produit</h2>
          <div className="form-grid">
            <input value={draft.brand} onChange={e=>setDraft(d=>({...d,brand:e.target.value}))} placeholder="Marque" />
            <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="Nom" />
            <select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))}><option value="hommes">Hommes</option><option value="femmes">Femmes</option><option value="enfants">Enfants</option></select>
            <input type="number" value={draft.price} onChange={e=>setDraft(d=>({...d,price:e.target.value}))} placeholder="Prix" />
            <input value={draft.image} onChange={e=>setDraft(d=>({...d,image:e.target.value}))} placeholder="URL image" />
            <input value={draft.variantsText} onChange={e=>setDraft(d=>({...d,variantsText:e.target.value}))} placeholder="Tailles et stocks : 40:4,41:5,42:6" />
            <textarea value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))} placeholder="Description" />
          </div>
          <img className="mapping-preview" src={resolveImg(draft.image)} alt="Prévisualisation" />
          <button onClick={async ()=>{ try { await createProduct({ brand:draft.brand, name:draft.name, category:draft.category, gender:draft.category, price:Number(draft.price), originalPrice:Number(draft.price)+20, image:draft.image, description:draft.description, colorway:'Custom', badge:'', featured:true, variants:draft.variantsText.split(',').map(s=>s.trim()).filter(Boolean).map((p,i)=>{ const [size, stock] = p.split(':'); return { sku:`CUSTOM-${Date.now()}-${i+1}`, size:String(size).trim(), stock:Number(stock||0), price:Number(draft.price) }; }) }); setMsg('Produit créé.'); setDraft({ brand:'Nike', name:'Air Max Demo', category:'hommes', price:129, image:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80', description:'Sneaker Nike Air Max.', variantsText:'40:4,41:5,42:6' }); load(); } catch(e) { setMsg(e.message); } }}>Créer le produit</button>
        </section>}
        <section className="panel stack-md">
          <h2>Édition des produits</h2>
          <div className="admin-products">{items.map(p => <div key={p.id} className="admin-card">
            <div className="mapping-grid">
              <img className="mapping-preview" src={resolveImg(p.image)} alt={p.name} />
              <div className="stack-md">
                <div className="form-grid">
                  <input value={p.brand || ''} onChange={e=>updateLocalProduct(p.id,{ brand:e.target.value })} placeholder="Marque" />
                  <input value={p.name || ''} onChange={e=>updateLocalProduct(p.id,{ name:e.target.value })} placeholder="Nom" />
                  <select value={p.category} onChange={e=>updateLocalProduct(p.id,{ category:e.target.value })}><option value="hommes">Hommes</option><option value="femmes">Femmes</option><option value="enfants">Enfants</option></select>
                  <input type="number" value={p.price} onChange={e=>updateLocalProduct(p.id,{ price:Number(e.target.value) })} placeholder="Prix" />
                  <input value={p.image || ''} onChange={e=>updateLocalProduct(p.id,{ image:e.target.value })} placeholder="URL image" />
                </div>
                <textarea value={p.description || ''} onChange={e=>updateLocalProduct(p.id,{ description:e.target.value })} />
              </div>
            </div>
            <div className="variant-grid">{p.sizes.map((s, idx) => <label key={`${p.id}-${idx}`}>Taille / stock
              <div className="row gap"><input value={s.size} onChange={e=>updateLocalSize(p.id,idx,e.target.value)} /><input type="number" value={s.stock} onChange={e=>updateLocalStock(p.id,idx,e.target.value)} /><button className="secondary" onClick={()=>removeLocalVariant(p.id,idx)}>−</button></div>
            </label>)}</div>
            <div className="row gap wrap"><button className="secondary" onClick={()=>addLocalVariant(p.id)}>Ajouter taille</button><button onClick={()=>saveMappedProduct(p)}>Sauvegarder</button>{user.role==='admin' && <button className="secondary" onClick={async ()=>{ await deleteProduct(p.id); setMsg(`Produit ${p.id} supprimé`); load(); }}>Supprimer</button>}</div>
          </div>)}</div>
        </section>
      </>}

      {tab === 'stocks' && <section className="panel stack-md">
        <h2>Stocks par produit</h2>
        <div className="admin-products">{items.map(p => <div key={p.id} className="admin-card">
          <div className="row gap between"><strong>{p.brand} {p.name}</strong><span className="chip">{p.category}</span></div>
          <div className="variant-grid">{p.sizes.map((s, idx) => <label key={`${p.id}-${idx}`}>Taille / stock
            <div className="row gap"><input value={s.size} onChange={e=>updateLocalSize(p.id,idx,e.target.value)} /><input type="number" value={s.stock} onChange={e=>updateLocalStock(p.id,idx,e.target.value)} /><button className="secondary" onClick={()=>removeLocalVariant(p.id,idx)}>−</button></div>
          </label>)}</div>
          <div className="row gap"><button className="secondary" onClick={()=>addLocalVariant(p.id)}>Ajouter taille</button><button onClick={()=>saveMappedProduct(p)}>Sauvegarder</button></div>
        </div>)}</div>
      </section>}

      {tab === 'orders' && <section className="panel stack-md">
        <h2>Commandes</h2>
        <div className="stack-md">{orderList.map(o => <div key={o.id} className="order-card"><div className="row between wrap"><strong>Commande #{o.id} · {o.userEmail}</strong><span className="chip">{o.tracking}</span></div><p className="muted">{o.status} · livraison {o.shippingStatus}</p><div className="row gap wrap"><select value={o.status} onChange={async e=>{ await updateOrder(o.id,{ status:e.target.value }); load(); }}><option value="confirmed">confirmée</option><option value="processing">en traitement</option><option value="cancelled">annulée</option></select><select value={o.shippingStatus} onChange={async e=>{ await updateOrder(o.id,{ shippingStatus:e.target.value }); load(); }}><option value="preparing">préparation</option><option value="shipped">expédiée</option><option value="delivered">livrée</option></select></div></div>)}</div>
      </section>}

      {tab === 'catalogue' && <section className="panel stack-md">
        <h2>Catalogue</h2>
        {mappingInfo && <div className="mapping-summary">
          <div><strong>Produits importés</strong> : {mappingInfo.lastImport?.imported ?? 0}</div>
          <div><strong>Mode</strong> : {mappingInfo.mode || mappingInfo.lastImport?.mode || '—'}</div>
          <div><strong>Sources</strong> : {mappingInfo.sources.map(s=>s.name).join(', ') || '—'}</div>
        </div>}
        {mappingInfo?.lastImport?.warnings?.length ? <div className="warning-box"><strong>Avertissements :</strong><ul>{mappingInfo.lastImport.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div> : null}
        <button className="secondary" disabled={mappingBusy} onClick={async ()=>{ try { setMappingBusy(true); setMsg('Import en cours…'); const result = await refreshWebMapping(100); setMsg(`Import terminé : ${result.imported} produits, ${result.activeProducts} actifs.`); await load(); } catch(e) { setMsg(e.message); } finally { setMappingBusy(false); } }}>{mappingBusy ? 'Import en cours…' : 'Importer le catalogue'}</button>
      </section>}

      {tab === 'rgpd' && <section className="panel stack-md">
        <h1>RGPD</h1>
        <ul className="clean-list"><li>Consentement stocké en localStorage</li><li>Panier stocké en localStorage</li><li>Session authentifiée par token JWT</li><li>Export des données utilisateur</li><li>Suppression des commandes d'un utilisateur</li></ul>
        <div className="row gap wrap">
          <button className="secondary" onClick={async ()=>{ try { const d = await exportData(); const blob = new Blob([JSON.stringify(d, null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mes-donnees.json'; a.click(); setMsg('Export téléchargé.'); } catch(e){ setMsg(e.message); } }}>Exporter mes données</button>
          <button className="secondary" onClick={async ()=>{ if(!window.confirm('Supprimer toutes vos données de commande ?')) return; try { await deleteData(); setMsg('Données supprimées.'); } catch(e){ setMsg(e.message); } }}>Supprimer mes données</button>
        </div>
      </section>}
    </div>
  </main>;
}
function EcoPage() {
  const [form, setForm] = React.useState({ prenom: '', email: '', marque: '', pointure: '', etat: 'bon', message: '' });
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState('');
  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function submit(e) {
    e.preventDefault();
    if (!form.prenom || !form.email || !form.marque || !form.pointure) { setErr('Veuillez remplir tous les champs obligatoires.'); return; }
    setErr('');
    const depot = { ...form, id: Date.now(), date: new Date().toISOString() };
    try { const list = JSON.parse(localStorage.getItem('eco_depots') || '[]'); list.push(depot); localStorage.setItem('eco_depots', JSON.stringify(list)); } catch {}
    setSent(true);
  }
  return (
    <div className="page stack-xl">
      <section className="eco-hero">
        <div>
          <p className="eyebrow">Eco-responsable</p>
          <h1 className="eco-title">Chaque paire<br/>compte.</h1>
          <p className="lead">Chez SneakR, nous nous engageons pour une mode sneakers plus durable — reprise, reconditionnement, emballage recyclé.</p>
        </div>
        <div className="eco-kpis">
          <div className="eco-kpi"><strong>2 400</strong><small>paires reconditionnées</small></div>
          <div className="eco-kpi"><strong>-35%</strong><small>empreinte carbone</small></div>
          <div className="eco-kpi"><strong>8 t</strong><small>matériaux recyclés</small></div>
          <div className="eco-kpi"><strong>100%</strong><small>emballages recyclables</small></div>
        </div>
      </section>
      <div className="eco-sections">
        <div className="panel stack-md">
          <h2>Reconditionnement</h2>
          <p>Déposez vos sneakers en bon état et obtenez un bon d'achat de <strong>10 € à 30 €</strong> selon l'état et la marque.</p>
          <div className="eco-steps">
            <div className="eco-step"><span>1</span><p>Remplissez le formulaire avec les infos de votre paire.</p></div>
            <div className="eco-step"><span>2</span><p>Envoyez la paire par Colissimo — l'étiquette est offerte.</p></div>
            <div className="eco-step"><span>3</span><p>Bon d'achat reçu sous 5 jours ouvrés.</p></div>
            <div className="eco-step"><span>4</span><p>La paire est nettoyée, restaurée et remise en vente à prix réduit.</p></div>
          </div>
        </div>
        <div className="panel stack-md">
          <h2>Emballages éco-conçus</h2>
          <p>Toutes nos expéditions utilisent des matériaux recyclés et recyclables.</p>
          <ul className="eco-list">
            <li>Boîtes en carton recyclé (sans plastique)</li>
            <li>Encres végétales, impressions minimales</li>
            <li>Calage en papier nid d'abeille</li>
            <li>Enveloppes biodégradables pour accessoires</li>
          </ul>
        </div>
      </div>
      <div className="panel stack-md eco-form-card">
        <h2>Déposer une paire</h2>
        {sent ? (
          <div className="eco-success-box">
            <p className="success">Demande enregistrée !</p>
            <p>Nous vous contacterons à l'adresse <strong>{form.email}</strong> pour finaliser l'envoi.</p>
            <button className="secondary" onClick={() => { setSent(false); setForm({ prenom: '', email: '', marque: '', pointure: '', etat: 'bon', message: '' }); }}>Déposer une autre paire</button>
          </div>
        ) : (
          <form onSubmit={submit} className="stack-md">
            <div className="form-grid">
              <div><label>Prénom *</label><input name="prenom" value={form.prenom} onChange={handle} placeholder="Votre prénom" /></div>
              <div><label>Email *</label><input name="email" type="email" value={form.email} onChange={handle} placeholder="votre@email.com" /></div>
              <div><label>Marque *</label><input name="marque" value={form.marque} onChange={handle} placeholder="Nike, Adidas..." /></div>
              <div><label>Pointure *</label><input name="pointure" value={form.pointure} onChange={handle} placeholder="42" /></div>
              <div><label>Etat</label>
                <select name="etat" value={form.etat} onChange={handle}>
                  <option value="neuf">Comme neuf</option>
                  <option value="bon">Bon état</option>
                  <option value="correct">Correct (traces d'usure)</option>
                  <option value="use">Usé</option>
                </select>
              </div>
            </div>
            <div><label>Message (optionnel)</label><textarea name="message" value={form.message} onChange={handle} placeholder="Informations complémentaires..." style={{minHeight:'80px'}} /></div>
            {err && <p className="error">{err}</p>}
            <button type="submit">Envoyer ma demande</button>
          </form>
        )}
      </div>
      <div className="panel stack-md">
        <h2>Nos partenaires</h2>
        <div className="eco-partners">
          <div className="eco-partner-card"><strong>ReSneakers</strong><small>Reconditionnement certifié</small></div>
          <div className="eco-partner-card"><strong>GreenPack</strong><small>Emballages durables</small></div>
          <div className="eco-partner-card"><strong>Colissimo Vert</strong><small>Livraison bas carbone</small></div>
          <div className="eco-partner-card"><strong>Soles4Souls</strong><small>Dons aux associations</small></div>
        </div>
      </div>
    </div>
  );
}
function RegisterPage({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = React.useState('');
  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  async function submit() {
    setError('');
    if (!form.firstName || !form.email || !form.password) { setError('Prénom, email et mot de passe sont requis.'); return; }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    try { const u = await register(form.firstName, form.lastName, form.email, form.password); setUser(u); navigate('/'); }
    catch(e) { setError(e.message); }
  }
  return <main className="page"><section className="panel auth-panel stack-md">
    <p className="eyebrow">Inscription</p>
    <h1>Créer un compte</h1>
    <div className="form-grid">
      <input name="firstName" value={form.firstName} onChange={handle} placeholder="Prénom *" />
      <input name="lastName" value={form.lastName} onChange={handle} placeholder="Nom" />
    </div>
    <input name="email" type="email" value={form.email} onChange={handle} placeholder="Email *" />
    <input name="password" type="password" value={form.password} onChange={handle} placeholder="Mot de passe *" />
    <input name="confirm" type="password" value={form.confirm} onChange={handle} placeholder="Confirmer le mot de passe" />
    <button onClick={submit}>Créer mon compte</button>
    {error && <p className="error">{error}</p>}
    <Link to="/login" className="text-link" style={{fontSize:'.9rem'}}>Déjà un compte ? Se connecter</Link>
  </section></main>;
}
function OrderConfirmPage() {
  const { state } = useLocation();
  const order = state && state.order;
  if (!order) return <Navigate to="/account" replace />;
  return <main className="page stack-lg">
    <section className="panel confirm-hero">
      <div className="confirm-check">✓</div>
      <h1>Commande confirmée !</h1>
      <p>Merci pour votre achat. Votre numéro de suivi : <span className="chip">{order.tracking}</span></p>
    </section>
    <section className="checkout-layout">
      <div className="panel stack-md">
        <h2>Détail de la commande #{order.id}</h2>
        {order.items.map((item, i) => <div key={i} className="summary-line"><span>{item.name} · taille {item.size} · x{item.qty}</span><strong>{money(item.lineTotal)}</strong></div>)}
        <div className="summary-line total"><span>Total</span><strong>{money(order.total)}</strong></div>
        <p className="muted" style={{fontSize:'.85rem'}}>{order.emailSimulation}</p>
      </div>
      <aside className="panel stack-md sticky">
        <h2>Livraison</h2>
        {order.shipping && <><p>{order.shipping.name}</p><p>{order.shipping.address}</p><p>{order.shipping.zip} {order.shipping.city}</p></>}
        <p>Statut : <strong>{order.shippingStatus}</strong></p>
        <Link to="/catalogue" className="btn-dark" style={{textAlign:'center',display:'block'}}>Continuer mes achats</Link>
        <Link to="/account" className="btn-light" style={{textAlign:'center',display:'block'}}>Voir mes commandes</Link>
      </aside>
    </section>
  </main>;
}
function NotFoundPage() {
  return <main className="page" style={{textAlign:'center',paddingTop:'60px'}}>
    <p style={{fontSize:'6rem',fontWeight:800,color:'rgba(255,255,255,.08)',margin:0,lineHeight:1}}>404</p>
    <h1 style={{color:'white',marginTop:'8px'}}>Page introuvable</h1>
    <p style={{color:'#94a3b8',marginBottom:'28px'}}>Cette page n'existe pas ou a été déplacée.</p>
    <Link to="/" className="btn-dark">Retour à l'accueil</Link>
  </main>;
}
function MentionsLegalesPage() {
  return <main className="page stack-lg"><section className="panel stack-md">
    <h1>Mentions légales</h1>
    <h2>Editeur</h2>
    <p>SneakR — Plateforme e-commerce de sneakers.<br/>Email : contact@sneakr.fr</p>
    <h2>Hébergement</h2>
    <p>Serveur Node.js/Express, base de données JSON.</p>
    <h2>Propriété intellectuelle</h2>
    <p>L'ensemble du contenu (textes, images, données) est la propriété de SneakR. Toute reproduction sans autorisation est interdite.</p>
    <h2>Données personnelles</h2>
    <p>Conformément au <strong>RGPD</strong>, vous disposez d'un droit d'accès, de rectification et de suppression. <Link to="/rgpd" className="text-link">Page RGPD</Link>.</p>
    <h2>Cookies</h2>
    <p>Le site utilise des cookies essentiels, analytiques et marketing. Gérez vos préférences via le bouton en bas de page.</p>
    <h2>Conditions générales de vente</h2>
    <p>Les paiements sont sécurisés. Délai de traitement : 48h ouvrées. Droit de rétractation : 14 jours après réception.</p>
  </section></main>;
}
function RgpdPage() {
  return <main className="page stack-lg"><section className="panel"><h1>RGPD</h1><p>Le site comporte une bannière de consentement stockée dans le navigateur, une session authentifiée, un export des données utilisateur et une suppression simulée des données de commande.</p><ul className="clean-list"><li>Consentement stocké en localStorage</li><li>Panier stocké en localStorage</li><li>Token d'authentification côté front</li><li>Export des données côté backend</li><li>Suppression des commandes d'un utilisateur</li></ul></section></main>;
}

export default function App() {
  const { user, setUser } = useSession();
  const [count, setCount] = React.useState(cartCount());
  const refreshCart = () => setCount(cartCount());
  return <BrowserRouter><CookieBanner /><Layout user={user} setUser={setUser} cartTotal={count}>
    <Routes>
      <Route path="/" element={<Home refreshCart={refreshCart} />} />
      <Route path="/catalogue" element={<Catalogue refreshCart={refreshCart} />} />
      <Route path="/product/:id" element={<ProductDetail refreshCart={refreshCart} />} />
      <Route path="/cart" element={<CartPage refreshCart={refreshCart} />} />
      <Route path="/checkout" element={<CheckoutPage user={user} refreshCart={refreshCart} />} />
      <Route path="/login" element={<LoginPage setUser={setUser} />} />
      <Route path="/register" element={<RegisterPage setUser={setUser} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/order-confirm" element={<OrderConfirmPage />} />
      <Route path="/account" element={user ? <AccountPage user={user} /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminPage user={user} />} />
      <Route path="/eco" element={<EcoPage />} />
      <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="/rgpd" element={<RgpdPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Layout></BrowserRouter>;
}
