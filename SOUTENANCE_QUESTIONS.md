# SneakR — Questions techniques pour la soutenance

---

## 1. Pourquoi React ?

**Réponse courte**
React est adapté à une application e-commerce : l'interface change fréquemment (filtres, panier, stock) et React ne re-rend que ce qui a changé grâce au Virtual DOM.

**Arguments**
- **Composants réutilisables** : `ProductCard`, `StockBadge`, `Img` (fallback) sont écrits une fois et utilisés partout — catalogue, home, back-office.
- **État local isolé** : le panier (`useState` + localStorage), les filtres du catalogue, les onglets du back-office ont chacun leur état sans se polluer.
- **React Router** : navigation SPA sans rechargement, URLs propres (`/product/:id`, `/admin`), redirections conditionnelles (`/login` si non connecté).
- **Hooks** : `useEffect` pour charger les données au montage, `useCallback` pour mémoïser les appels filtrés, `useNavigate` pour les redirections post-checkout.
- **Maturité** : ecosystem stable, Vite pour le build ultra-rapide en dev.

**Ce qu'on aurait perdu avec du JS vanilla**
Sans React, chaque filtre du catalogue nécessiterait un `document.querySelectorAll` + re-render manuel du DOM — source de bugs et code difficile à maintenir.

---

## 2. Pourquoi Express ?

**Réponse courte**
Express est un micro-framework minimaliste : on ajoute exactement ce dont on a besoin, sans overhead. Parfait pour une API REST de démonstration.

**Arguments**
- **Légèreté** : 5 dépendances seulement (`express`, `cors`, `jsonwebtoken`, `bcryptjs`, `dotenv`). Pas de ORM, pas de CLI, pas de magie cachée.
- **Middleware chaînable** : `auth` + `allow('admin','seller')` s'enchaînent sur les routes sensibles en une ligne — facile à expliquer, facile à tester.
- **Flexibilité** : on a ajouté des routes sans toucher aux routes existantes, dans l'ordre qu'on voulait.
- **JSON natif** : `express.json()` parse le body automatiquement, `res.json()` sérialise la réponse — zéro boilerplate.
- **Rapidité de prototypage** : 18 routes fonctionnelles en un seul fichier `server.js` lisible par n'importe qui.

**Alternative possible**
Fastify serait 20–30 % plus rapide en production, mais Express reste le standard pédagogique et sa documentation est inégalée.

---

## 3. Pourquoi JSON DB (fichiers JSON) ?

**Réponse courte**
La base JSON répond exactement au besoin du projet : persistance locale, zero-config, lisible à l'œil nu, pas de serveur supplémentaire à lancer.

**Arguments**
- **Zéro dépendance externe** : pas de MySQL, pas de MongoDB à installer et démarrer — le prof clone et `npm start` suffit.
- **Transparence** : ouvrir `products.json` dans VSCode montre immédiatement la structure des données — idéal pour une soutenance.
- **Cohérent avec l'échelle** : 120 produits, quelques dizaines de commandes — un fichier JSON lu/écrit par `fs.readFileSync/writeFileSync` répond en < 1 ms.
- **Preuve du mapping** : `mappedFrom` dans chaque produit et `last-import.json` sont lisibles directement — aucune requête SQL nécessaire pour les montrer.

**Limites assumées**
Pas de transactions, pas de requêtes complexes, pas de concurrence. En production, on migrerait vers PostgreSQL ou MongoDB. Ce n'est pas l'objet du projet.

---

## 4. Pourquoi JWT ?

**Réponse courte**
JWT permet une authentification *stateless* : le serveur ne stocke aucune session — le token contient toutes les informations nécessaires, signé cryptographiquement.

**Arguments**
- **Stateless** : le backend ne maintient pas de table de sessions. Chaque requête porte son propre token dans l'en-tête `Authorization: Bearer <token>`.
- **Payload utile** : `{ id, email, role }` embarqué dans le token — le middleware `auth` décode le rôle sans faire de requête base de données.
- **Expiration** : `expiresIn: '7d'` — le token expire automatiquement, pas besoin de gérer une déconnexion côté serveur.
- **Sécurité** : signé avec `JWT_SECRET` (HS256) — toute falsification du payload invalide la signature.
- **Standard** : utilisé par tous les grands acteurs (Google, GitHub, Stripe) — le jury connaît.

**Ce qu'on a fait**
```
POST /api/auth/login
→ bcrypt.compareSync(password, hash)  ✓
→ jwt.sign({ id, email, role }, SECRET, { expiresIn: '7d' })
→ stocké localStorage côté client
→ envoyé dans Authorization: Bearer à chaque requête protégée
```

---

## 5. Pourquoi pas SQL ?

**Réponse courte**
SQL aurait été sur-dimensionné pour ce projet : il aurait ajouté une dépendance de serveur (MySQL/PostgreSQL), des migrations, un ORM — sans bénéfice mesurable à cette échelle.

**Comparaison honnête**

| Critère | JSON DB (notre choix) | SQL |
|---------|----------------------|-----|
| Installation | `npm install` | Serveur séparé, config, credentials |
| Lisibilité | Fichier texte, ouvrable dans VSCode | `SELECT` + JOIN pour voir les données |
| Requêtes complexes | `Array.filter/sort` (suffisant ici) | Nécessaire à partir de millions de lignes |
| Transactions | Non (pas nécessaire ici) | Oui (critique en production) |
| Démo | Clone + start = fonctionne | Dépend de l'environnement du jury |
| Migration vers SQL | Triviale (même structure JSON) | N/A |

**Quand on passerait à SQL**
Dès qu'on aurait : plusieurs serveurs (concurrence sur les fichiers), des recherches full-text complexes, des jointures entre commandes/produits/utilisateurs à grande échelle, ou des transactions critiques (paiement réel).

**Ce projet démontre qu'on sait POURQUOI choisir un outil**, pas seulement comment l'utiliser.
