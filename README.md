# SneakR — E-Commerce Sneakers

Projet Bootcamp Web — Epitech Digital School 2026

## Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | React 18 + Vite | SPA responsive, routing client |
| Backend | Node.js + Express | API REST, logique métier, auth |
| Base de données | JSON (fs) | Persistance fichiers, sans dépendance externe |
| Auth | JWT + bcryptjs | Tokens signés 7j, mots de passe hashés |
| RGPD | localStorage + cookie | Consentement granulaire, export, suppression |

---

## Installation & lancement

### Prérequis : Node.js 18+

```bash
# Backend
cd sneakers-backend
cp .env.example .env       # optionnel : ajouter KICKSDB_API_KEY
npm install
node scripts/seed.js       # génère 120 produits + 3 comptes hashés
npm start                  # → http://localhost:5051

# Frontend (autre terminal)
cd sneakers-frontend
npm install
npm run dev                # → http://localhost:5173
```

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@test.com | admin |
| Vendeur | seller@test.com | seller |
| Client | client@test.com | client |

*Stockés hashés (bcrypt $2b$10$…) — jamais en clair.*

---

## Architecture

```
sneakersfinal/
├── sneakers-backend/
│   ├── server.js              Express — 18 routes, JWT, bcrypt, rôles
│   ├── .env.example           Variables d'environnement (clé API optionnelle)
│   ├── package.json           bcryptjs, cors, dotenv, express, jsonwebtoken
│   ├── scripts/
│   │   ├── seed.js            120 produits + comptes (mots de passe hashés)
│   │   └── import-web-mapping.js  Import KicksDB → Shopify → fallback local
│   └── data/
│       ├── products.json      Catalogue persisté (120+ refs, stock par taille)
│       ├── users.json         Comptes (hashes bcrypt)
│       ├── orders.json        Commandes
│       ├── reviews.json       Avis clients
│       ├── reconditioning.json Demandes de reconditionnement
│       └── mapping/
│           └── last-import.json  Audit du dernier import (affiché en back-office)
└── sneakers-frontend/
    ├── public/logo.svg        Logo vectoriel SneakR
    ├── index.html             Titre + favicon SVG
    └── src/
        ├── App.jsx            SPA React — toutes les pages (1 000 lignes)
        ├── api/index.js       Appels REST + panier localStorage
        ├── index.css          Design system dark, responsive
        └── CHARTE_GRAPHIQUE.md  Couleurs, typo, usage logo
```

---

## Flux commande

```
Client                  Frontend               Backend              JSON DB
  │                         │                     │                    │
  ├─ Catalogue + filtres ──►│── GET /products ───►│── products.json ──►│
  │                         │                     │                    │
  ├─ Sélection taille ─────►│                     │                    │
  ├─ Ajout panier ──────────│── localStorage ─────│                    │
  │                         │                     │                    │
  ├─ Checkout ─────────────►│── POST /orders ─────│                    │
  │                         │    (JWT requis)      │── vérifie stock ──►│
  │                         │                     │── décrémente ──────►│
  │                         │                     │── crée commande ───►│
  │                         │◄── { order, email } ─│                    │
  ├─ Page confirmation ◄────│                     │                    │
  │   + email simulé        │                     │                    │
```

---

## Rôles et accès

```
┌─────────┬──────────────────────────────────────────────────────────┐
│  Rôle   │  Accès                                                   │
├─────────┼──────────────────────────────────────────────────────────┤
│ client  │  Catalogue · Fiche produit · Panier · Checkout           │
│         │  Historique commandes · Avis · RGPD · Compte             │
├─────────┼──────────────────────────────────────────────────────────┤
│ seller  │  + Back-office stocks (modification uniquement)          │
│         │  + Suivi commandes (statut expédition)                   │
│         │  + Gestion reconditionnement                             │
│         │  ✗ Pas de création/suppression produit                   │
│         │  ✗ Pas de gestion utilisateurs                           │
├─────────┼──────────────────────────────────────────────────────────┤
│ admin   │  Accès total : idem + création/suppression produit       │
│         │  + Gestion utilisateurs (rôles, suppression)             │
│         │  + Dashboard stats + audit import catalogue              │
└─────────┴──────────────────────────────────────────────────────────┘
```

Chaque route sensible est protégée par deux middlewares backend :
- `auth` — vérifie et décode le JWT
- `allow('admin','seller')` — vérifie le rôle dans le payload

---

## Mapping catalogue

```
npm run mapping:api
       │
       ├─► 1. KicksDB API (si KICKSDB_API_KEY dans .env)
       │       vraies données sneakers via API REST
       │
       ├─► 2. Shopify public (si KicksDB absent ou insuffisant)
       │       Kith · Sneaker Politics · Feature
       │       /products.json public, sans clé
       │
       └─► 3. Catalogue local (si pas d'Internet)
               fallback garanti pour la démo offline

Chaque produit normalisé contient :
  mappedFrom.source        →  nom de la source
  mappedFrom.sourceType    →  'api-key' | 'public-catalogue' | 'local-fallback'
  mappedFrom.importedAt    →  horodatage ISO
  mappedFrom.productUrl    →  URL produit source si disponible

L'audit (last-import.json) est affiché dans le dashboard admin.
```

---

## Parcours de test complet

### 1. Client
1. Ouvrir http://localhost:5173 → paramétrer les cookies
2. Connexion `client@test.com / client`
3. Catalogue → filtre Hommes + taille EU 42
4. Fiche produit → stock par taille visible
5. Ajouter au panier → modifier quantité
6. Checkout → page confirmation avec **email simulé**
7. Retour fiche produit → stock de la taille commandée a baissé

### 2. Vendeur
1. Connexion `seller@test.com / seller`
2. `/admin` → pas de création produit, pas d'onglet Utilisateurs
3. Modifier stock d'une taille → Sauvegarder
4. Changer statut expédition d'une commande

### 3. Admin
1. Connexion `admin@test.com / admin`
2. Dashboard → stats + bloc **Dernier import catalogue**
3. Créer un produit · Gérer les utilisateurs
4. RGPD → exporter ses données en JSON

### 4. RGPD
1. `/rgpd` → gérer préférences cookies
2. `/politique-confidentialite` → politique complète
3. `/account` → exporter · supprimer ses données

---

## Routes API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/login` | — | JWT + bcrypt |
| POST | `/api/auth/register` | — | Hash password |
| GET | `/api/products` | — | Filtres : q, category, size, price, sort |
| GET | `/api/products/:id` | — | Fiche + variants |
| POST | `/api/orders` | client+ | Checkout + stock décrémenté |
| GET | `/api/orders` | client+ | Historique (admin/seller = tout) |
| PATCH | `/api/orders/:id` | admin/seller | Statut |
| GET | `/api/admin/stats` | admin/seller | Stats + audit import |
| GET | `/api/rgpd/export` | client+ | JSON données |
| DELETE | `/api/rgpd/delete` | client+ | Suppression commandes |

---

## Sécurité

- `.env` exclu du dépôt — `.env.example` fourni sans clé réelle
- Mots de passe hashés bcrypt (`$2b$10$…`), jamais retournés par l'API
- JWT signés HS256, expiration 7 jours
- Routes admin/seller protégées double middleware (auth + allow)
- Aucune donnée bancaire réelle — paiement 100% fictif
