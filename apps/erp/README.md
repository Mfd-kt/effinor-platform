# Effinor ERP (V1)

Application Next.js pour le pilotage des dossiers CEE (Certificats d’Économies d’Énergie).

## Prérequis

- Node.js 20+
- Projet Supabase (URL + clé anon) et schéma appliqué (`supabase/migrations/`)

## Configuration

1. Copier les variables d’environnement :

   ```bash
   cp .env.local.example .env.local
   ```

2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (tableau Supabase → API).

3. Lancer le serveur de développement :

   ```bash
   npm install
   npm run dev
   ```

4. Ouvrir [http://localhost:3000](http://localhost:3000) — redirection vers `/login` si non connecté.

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run generate:types` | Régénère `types/database.types.ts` (CLI Supabase installée, projet lié) |

## Structure

- `app/` — routes App Router (`(auth)`, `(dashboard)`)
- `components/` — UI partagée et layout
- `features/` — modules métier (composants par domaine, Phase 4+)
- `lib/supabase/` — clients navigateur / serveur / middleware
- `server/actions` & `server/queries` — actions serveur et accès données
- `supabase/` — migrations SQL et seed

## Documentation Next.js

[Documentation Next.js](https://nextjs.org/docs)
