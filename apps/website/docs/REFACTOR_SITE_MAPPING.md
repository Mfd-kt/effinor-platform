# Mapping refonte site (lead-gen CEE — PAC + déstrat)

Document de gel d’inventaire : routes supprimées, remplacées ou conservées. Ne pas modifier ce fichier pour le plan produit ; il sert de référence technique.

## App principale (`src/`)

### Routes publiques — remplacements / redirections

| Ancienne route | Nouvelle destination |
|----------------|----------------------|
| `/landing/luminaires` | `/` (301 côté serveur recommandé) |
| `/landing/deshumidificateur` | `/destratification` |
| `/produits-solutions`, `/:slug` | `/pompe-a-chaleur` ou `/` |
| `/produit/:slug` | `/pompe-a-chaleur` |
| `/panier`, `/paiement/*` | `/` |
| `/boutique` | `/` |
| `/produits` (public) | `/` |
| `/solutions`, `/solutions/:slug` | `/pompe-a-chaleur` |

### Routes publiques — nouvelles

- `/pompe-a-chaleur`, `/pompe-a-chaleur/residentiel`, `/pompe-a-chaleur/tertiaire`
- `/destratification`, `/destratification/tertiaire`, `/destratification/industriel`
- `/cee`
- `/simulateur` → même intention que `/formulaire-complet` (point d’entrée conversion)
- `/eligibilite` → `/formulaire-complet`
- `/secteurs` → `/secteurs-activite` (alias)

### Routes conservées (public)

- `/`, `/formulaire-complet`, `/merci`, `/contact`, `/a-propos`, `/blog`, `/blog/:slug`
- `/secteurs-activite`, `/secteurs-activite/:slug`, `/realisations`, `/realisations/:slug`
- `/services-accompagnement`, `/ressources`, légal (`/mentions-legales`, `/cgv`, `/politique-confidentialite`)
- Auth + espace client inchangés

### Admin — routes retirées du routeur

- `/produits*`, `/categories`, `/commandes*`, `/paramètres/order-statuses`
- Redirections legacy : vers `/dashboard` ou `/leads` selon contexte

### Fichiers / dossiers supprimés (luminaires)

- `src/pages/landing/LandingLuminaires.jsx`
- `src/components/landing/luminaires/*`
- `src/services/landing/luminaires/*`
- `src/lib/landing/luminaires/*`

## Apps parallèles (hors build principal)

- `Luminaires/` : non utilisée par l’app principale ; déploiement séparé éventuel.
- `landing-deshumidificateur-source/` : template historique.

## Edge Functions

- `create-lead-and-redirect` : défauts `source` / `type_projet` alignés PAC/Déstrat (plus luminaires).
