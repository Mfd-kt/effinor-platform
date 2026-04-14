# Effinor — monorepo (Vite + React)

Structure : plusieurs applications indépendantes + packages partagés. Chaque app peut être déployée seule (Dokploy, Docker) sur son sous-domaine.

## Prérequis

- Node.js ≥ 20
- npm 7+ (workspaces)

## Installation (à la racine `effinor-platform/`)

```bash
npm install
```

**Variables d’environnement :** un seul fichier à la racine du monorepo — copier `.env.example` → `.env.local` dans `effinor-platform/`, puis renseigner au minimum `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (les apps Vite peuvent réutiliser les mêmes valeurs dans `VITE_*` si besoin).

## Ports dev

| Application | Port | Exemple DNS |
|-------------|------|-------------|
| `website` | 3000 | effinor.fr |
| `erp` | 3001 | erp.effinor.fr |
| `landing-luminaires` | 3002 | luminaires.effinor.fr |
| `landing-pac` | 3003 | pac.effinor.fr (ou autre) |
| `landing-destratification` | 3004 | destrat.effinor.fr (ou autre) |

## Commandes

```bash
# Racine
npm run dev:website
npm run dev:erp
# Si le port 3001 est déjà pris (EADDRINUSE) : libérer le port ou lancer sur 3005
npm run dev:erp:alt
npm run dev:landing:luminaires
npm run dev:landing:pac
npm run dev:landing:destrat

# Depuis une app (équivalent)
cd apps/website && npm run dev
cd apps/erp && npm run dev
```

Build de tout le monorepo :

```bash
npm run build
```

Build d’une app :

```bash
npm run build -w @effinor/website
```

## Packages partagés

- `@effinor/ui` — composants React (ex. `Button`)
- `@effinor/lib` — client Supabase navigateur, utilitaires (`formatEuro`, `cn`)

Import dans une app : `import { Button } from "@effinor/ui"` et `import { formatEuro } from "@effinor/lib"`.

## Docker / Dokploy

- **Contexte de build** : répertoire `effinor-platform` (racine du monorepo — celui qui contient le `package-lock.json` unique).
- **Dockerfile** : un par app (`apps/<nom>/Dockerfile`). Ex. ERP : fichier **`apps/erp/Dockerfile`**, contexte **toujours la racine** (sinon `npm ci` échoue).
- **Fichier Docker** dans Dokploy : chemin Dockerfile = `apps/erp/Dockerfile` (ou autre app), **Build Context** = racine du repo cloné.

Variables Vite (`VITE_SUPABASE_*`) : les passer en **build args** dans Dokploy puis dans le Dockerfile avant `npm run build`, par exemple :

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

## Sous-domaines (suggestion)

1. Chez ton registrar / DNS : enregistrements **A** ou **CNAME** vers l’IP ou le domaine fourni par Dokploy (souvent un reverse proxy).
2. Une **application Dokploy** par site : même image/repo, Dockerfile différent, variables d’environnement par app.
3. Dans le panneau Dokploy, associe le **domaine** (ex. `erp.effinor.fr`) au service qui sert le conteneur nginx (port 80 interne).

## Notes

- Les dépendances internes utilisent `file:../../packages/...` (compatible tous les npm récents). Avec npm 9+, tu peux passer à `"workspace:*"` si tu préfères.
- Le projet Next.js historique (hors de ce dossier) peut coexister le temps de migrer l’ERP vers `apps/erp`.
- Ne pas importer une app dans une autre : seulement `@effinor/ui` et `@effinor/lib`.
