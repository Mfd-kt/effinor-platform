# @effinor/website

Site vitrine Effinor — `effinor.fr`

## Stack
- Next.js 16.2.1 (App Router, React Compiler activé)
- React 19.2.4
- Tailwind CSS v4 (via @tailwindcss/postcss)
- Design system : `@effinor/design-system`
- Utils : `@effinor/lib`
- Supabase (partagé avec ERP)
- Port dev : `3000`

## Variables d'environnement

Les variables sont chargées via un **symlink** vers le `.env.local` racine du monorepo :

```bash
apps/website/.env.local -> ../../.env.local
```

Variables requises (voir `.env.example`) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Scripts

```bash
npm run dev        # Serveur dev sur localhost:3000
npm run build      # Build production
npm run start      # Lancer le build (port 3000)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## État de la refonte

Cette app est en cours de refonte (Phase 3 — refonte monorepo Next.js).
Pages à venir :
- [ ] Accueil
- [ ] À propos
- [ ] Services (PAC maison, PAC immeuble, SSC, Rénovation globale)
- [ ] Contact (formulaire → table contacts)
- [ ] Mentions légales / CGV / RGPD

## Déploiement

Pas encore configuré. Sera déployé sur Dokploy en Phase 3.10.
