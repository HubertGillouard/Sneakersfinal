# Charte graphique — SneakR Elite

## Couleurs

| Rôle              | Valeur HEX | Utilisation                                 |
|-------------------|-----------|---------------------------------------------|
| Primaire (violet) | `#7c3aed` | CTA, logo, boutons principaux, badges       |
| Primaire clair    | `#a855f7` | Dégradé boutons, hover states               |
| Accent (vert)     | `#10b981` | Lettre "R" du logo, succès, stock OK        |
| Dark navy         | `#0f172a` | Background principal du site                |
| Panel             | `rgba(255,255,255,0.9)` | Cartes et panneaux de contenu  |
| Texte             | `#0f172a` | Corps de texte sur fond clair               |
| Texte muted       | `#64748b` | Labels secondaires, métadonnées             |

## Logo

Fichier : `public/logo.svg`

Le logo est composé de deux éléments :
- **Icône semelle** — silhouette stylisée évoquant un "S" et une semelle de sneaker, en violet `#7c3aed`
- **Typographie** — "Sneak" en violet `#7c3aed` + "R" en vert `#10b981`, Arial Black / sans-serif, poids 900

Hauteur recommandée dans l'interface : 36px (header). Le SVG est responsive et reste lisible à 20px.

Usage accepté :
- Sur fond sombre (dark navy) : logo tel quel ✅
- Sur fond blanc/clair : ajouter `filter: brightness(0.85)` ou version noir disponible ✅
- Espacement minimum autour du logo : 12px de chaque côté

Ne pas déformer, recolorer ou séparer l'icône du texte.

## Typographie

| Niveau     | Police           | Poids | Taille  |
|------------|------------------|-------|---------|
| H1 titre   | Inter / system-ui | 800  | 2–2.4rem |
| H2 section | Inter / system-ui | 700  | 1.4–1.6rem |
| Corps      | Inter / system-ui | 400  | 0.95rem  |
| Label muted | Inter / system-ui | 400 | 0.85rem  |
| CTA bouton | Inter / system-ui | 700  | 0.95rem  |

Police déclarée en CSS : `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

## Composants visuels

- **Boutons principaux** : dégradé `#7c3aed → #a855f7`, border-radius 16px, ombre violette
- **Boutons secondaires** : fond transparent, bordure semi-transparente
- **Cartes produit** : fond blanc/translucide, border-radius 20px, légère ombre
- **Badges** : petites pills colorées, border-radius 100px
- **Stock OK** : vert `#047857`  
- **Stock faible** : orange `#d97706`  
- **Rupture** : rouge `#b91c1c`

## Responsive

- Mobile : < 640px — 1 colonne, navigation en colonne
- Tablette : 641–1024px — 2 colonnes
- Desktop : > 1024px — 3–4 colonnes, layout complet
