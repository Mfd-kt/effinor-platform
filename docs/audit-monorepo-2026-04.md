# Audit Monorepo Effinor Platform — Avril 2026

> Généré le 2026-04-25. Lecture seule — aucun fichier modifié.

---

## 1. Inventaire des apps

### 1.1 `apps/erp` — `@effinor/erp`

| Propriété | Valeur |
|-----------|--------|
| Framework | **Next.js 16.2.1** |
| React | **19.2.4** |
| Port | `3001` (défaut via `${PORT:-3001}`) |
| Taille (hors `node_modules`) | **364 Mo** |
| Fichiers source (`.ts/.tsx/.js/.jsx`) | **1 477** |

**Scripts npm**

| Script | Commande |
|--------|----------|
| `dev` | `next dev --webpack -p ${PORT:-3001}` |
| `build` | `next build` |
| `start` | `node .next/standalone/apps/erp/server.js` |
| `lint` | `eslint` |
| `generate:types` | `supabase gen types typescript --local > types/database.types.ts` |
| `test` | `vitest run` |

**Dépendances principales**

| Package | Version | Rôle |
|---------|---------|------|
| `next` | 16.2.1 | Framework SSR |
| `react` / `react-dom` | 19.2.4 | UI |
| `@supabase/ssr` | ^0.10.0 | Auth + DB SSR |
| `@supabase/supabase-js` | ^2.101.1 | Client DB |
| `react-hook-form` | ^7.72.0 | Formulaires |
| `zod` | ^3.24.2 | Validation |
| `@tanstack/react-table` | ^8.21.3 | Tables |
| `recharts` | ^3.8.1 | Graphiques |
| `openai` | ^6.33.0 | IA (GPT) |
| `nodemailer` | ^8.0.5 | Envoi email |
| `imapflow` | ^1.3.1 | Sync email IMAP |
| `mailparser` | ^3.9.8 | Parsing email |
| `leaflet` / `react-leaflet` | 1.9.4 / 5.0.0 | Cartographie |
| `@react-google-maps/api` | ^2.20.8 | Google Maps |
| `playwright` | ^1.59.1 | Génération PDF |
| `sonner` | ^2.0.7 | Toasts |
| `lucide-react` | ^1.7.0 | Icônes |
| `class-variance-authority` | ^0.7.1 | Variantes UI |
| `tailwindcss` | ^4 | Styles |
| `vitest` | ^4.1.4 | Tests |
| `babel-plugin-react-compiler` | 1.0.0 | React Compiler |

---

### 1.2 `apps/website` — `@effinor/website`

| Propriété | Valeur |
|-----------|--------|
| Framework | **Vite 4.4.5** |
| React | **18.2.0** |
| Port | `3000` |
| Taille (hors `node_modules`) | **21 Mo** |
| Fichiers source | **405** |

> ⚠️ Vite **4** et React **18** — significativement en retard sur les autres apps.

**Scripts npm**

| Script | Commande |
|--------|----------|
| `dev` | `vite --host :: --port 3000` |
| `dev:dashboard` | `vite --host :: --port 3000 --open /dashboard` |
| `build` | `node tools/generate-sitemap.mjs && vite build && node tools/create-spa-fallbacks.mjs` |
| `preview` | `vite preview --host :: --port 3000` |

**Dépendances principales**

| Package | Version | Rôle |
|---------|---------|------|
| `react` / `react-dom` | ^18.2.0 | UI |
| `react-router-dom` | ^6.16.0 | Routing SPA |
| `@supabase/supabase-js` | **2.30.0** (pinné) | DB client |
| `framer-motion` | ^10.16.4 | Animations |
| `recharts` | ^2.10.1 | Graphiques |
| `@stripe/stripe-js` | ^8.5.3 | Paiement |
| `zod` | ^3.22.4 | Validation |
| `date-fns` | ^4.1.0 | Dates |
| `react-markdown` | ^10.1.0 | Rendu Markdown |
| Radix UI (×9) | mixtes | Composants headless |
| `tailwindcss` | ^3.3.3 | Styles |

---

### 1.3 `apps/landing-pac` — `@effinor/landing-pac`

| Propriété | Valeur |
|-----------|--------|
| Framework | **Vite 6.0.3** |
| React | **19.0.0** |
| Port | `3003` (`strictPort: true`) |
| Taille (hors `node_modules`) | **240 Ko** |
| Fichiers source | **5** |

> App embryonnaire — 5 fichiers, sert essentiellement de proof-of-concept pour `@effinor/ui` et `@effinor/lib`.

**Scripts npm**

| Script | Commande |
|--------|----------|
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |

**Dépendances principales**

| Package | Version |
|---------|---------|
| `@effinor/lib` | `file:../../packages/lib` |
| `@effinor/ui` | `file:../../packages/ui` |
| `react` / `react-dom` | ^19.0.0 |

---

### 1.4 `apps/landing-destratification` — `@effinor/landing-destratification`

| Propriété | Valeur |
|-----------|--------|
| Framework | **Vite 4.4.5** |
| React | **18.2.0** |
| Port | `3000` (conflit potentiel avec `website`) |
| Taille (hors `node_modules`) | **1,6 Mo** |
| Fichiers source | **77** |

> ⚠️ Même port `3000` que `website` — impossible de lancer les deux simultanément.  
> ⚠️ Vite **4** et React **18** — en retard sur `landing-pac` (Vite 6 / React 19).  
> Contient un backend PHP (`dev:api`) et des plugins Vite custom (visual-editor, selection-mode).

**Scripts npm**

| Script | Commande |
|--------|----------|
| `dev` | `vite --host :: --port 3000` |
| `dev:api` | `php -S 127.0.0.1:8080 -t public` |
| `build` | `node tools/generate-llms.js \|\| true && vite build` |
| `preview` | `vite preview --host :: --port 3000` |
| `lint` | `eslint . --quiet` |

**Dépendances principales**

| Package | Version | Rôle |
|---------|---------|------|
| `react` / `react-dom` | ^18.2.0 | UI |
| `react-router-dom` | ^6.16.0 | Routing SPA |
| `framer-motion` | ^10.16.4 | Animations |
| Radix UI (×13) | mixtes | Composants headless |
| `tailwindcss` | ^3.3.3 | Styles |

---

### Synthèse apps

| App | Framework | Vite | React | Port | Taille | Fichiers |
|-----|-----------|------|-------|------|--------|----------|
| `erp` | Next.js 16.2.1 | — | 19.2.4 | 3001 | 364 Mo | 1 477 |
| `website` | Vite | 4.4.5 | 18.2.0 | 3000 | 21 Mo | 405 |
| `landing-pac` | Vite | 6.0.3 | 19.0.0 | 3003 | 240 Ko | 5 |
| `landing-destratification` | Vite | 4.4.5 | 18.2.0 | **3000** ⚠️ | 1,6 Mo | 77 |

---

## 2. Inventaire des packages partagés

### 2.1 `@effinor/ui`

| Propriété | Valeur |
|-----------|--------|
| peerDependencies React | `^19.0.0` |
| Point d'entrée | `./src/index.ts` |
| Build | `tsc` uniquement |

**Exports exhaustifs**

| Export | Type | Description |
|--------|------|-------------|
| `Button` | Composant React | Bouton avec variantes primary/secondary, style inline hardcodé (`#0f766e`, `#ccc`, `#fff`, `#111`) |
| `ButtonProps` | Type TypeScript | Props du composant Button |

> **État actuel : embryonnaire.** 1 composant, style inline (pas de Tailwind, pas de shadcn). Couleur primaire `#0f766e` ne correspond à aucune palette définie dans les autres apps.

**Consommation dans les apps**

| App | Importe `@effinor/ui` | Ce qui est importé |
|-----|-----------------------|--------------------|
| `landing-pac` | ✅ | `Button` |
| `erp` | ❌ | — |
| `website` | ❌ | — |
| `landing-destratification` | ❌ | — |

---

### 2.2 `@effinor/lib`

| Propriété | Valeur |
|-----------|--------|
| peerDependencies React | Aucune (framework-agnostic) |
| Dépendance | `@supabase/supabase-js ^2.49.1` |
| Point d'entrée | `./src/index.ts` |

**Exports exhaustifs**

| Export | Type | Description |
|--------|------|-------------|
| `createSupabaseBrowserClient(config)` | Fonction | Factory Supabase client navigateur |
| `supabaseConfigFromEnv()` | Fonction | Lit `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| `SupabaseBrowserConfig` | Type | `{ url: string; anonKey: string }` |
| `cn(...parts)` | Fonction | Join CSS classes (null-safe) |
| `formatEuro(amount, locale?)` | Fonction | Formatage devise EUR |

**Consommation dans les apps**

| App | Importe `@effinor/lib` |
|-----|------------------------|
| `landing-pac` | Déclaré en dépendance, **non importé dans le code** ⚠️ |
| `erp` | ❌ — utilise son propre `@/lib/supabase/` |
| `website` | ❌ — utilise `@supabase/supabase-js` directement |
| `landing-destratification` | ❌ |

**Compatibilité React 19 / Next.js 16**

| Critère | Statut |
|---------|--------|
| `@effinor/ui` peerDep React ^19 | ✅ Compatible |
| `@effinor/lib` sans React | ✅ Compatible tous environnements |
| `@effinor/ui` non consommé par ERP | ⚠️ Pas de test réel Next.js 16 |
| `@supabase/supabase-js` dans lib (^2.49.1) vs ERP (^2.101.1) | ⚠️ Versions divergentes |

---

## 3. Charte graphique

### 3.1 Palette de couleurs

#### Palette `apps/website` (source principale — `global-design-system.css`)

**Primary — Slate Blue Marine**

| Token | Hex |
|-------|-----|
| `--primary-50` | `#F8FAFC` |
| `--primary-100` | `#F1F5F9` |
| `--primary-200` | `#E2E8F0` |
| `--primary-300` | `#CBD5E1` |
| `--primary-400` | `#94A3B8` |
| `--primary-500` | `#64748B` |
| `--primary-600` | `#475569` |
| `--primary-700` | `#334155` |
| `--primary-800` | `#1E293B` |
| `--primary-900` | `#0F172A` |

**Secondary — Green Energy**

| Token | Hex |
|-------|-----|
| `--secondary-50` | `#ECFDF5` |
| `--secondary-100` | `#D1FAE5` |
| `--secondary-200` | `#A7F3D0` |
| `--secondary-300` | `#6EE7B7` |
| `--secondary-400` | `#34D399` |
| `--secondary-500` | `#10B981` ← couleur principale |
| `--secondary-600` | `#059669` |
| `--secondary-700` | `#047857` |
| `--secondary-800` | `#065F46` |
| `--secondary-900` | `#064E3B` |

**Accent — Amber Yellow Energy**

| Token | Hex |
|-------|-----|
| `--accent-50` | `#FFFBEB` |
| `--accent-100` | `#FEF3C7` |
| `--accent-200` | `#FDE68A` |
| `--accent-300` | `#FCD34D` |
| `--accent-400` | `#FBBF24` |
| `--accent-500` | `#F59E0B` ← couleur principale |
| `--accent-600` | `#D97706` |
| `--accent-700` | `#B45309` |
| `--accent-800` | `#92400E` |
| `--accent-900` | `#78350F` |

**Neutral — Gray**

| Token | Hex |
|-------|-----|
| `--gray-50` | `#F9FAFB` |
| `--gray-100` | `#F3F4F6` |
| `--gray-200` | `#E5E7EB` |
| `--gray-300` | `#D1D5DB` |
| `--gray-400` | `#9CA3AF` |
| `--gray-500` | `#6B7280` |
| `--gray-600` | `#4B5563` |
| `--gray-700` | `#374151` |
| `--gray-800` | `#1F2937` |
| `--gray-900` | `#111827` |

**Utilitaires**

| Token | Hex | Usage |
|-------|-----|-------|
| `--white` | `#FFFFFF` | |
| `--success` | `#10B981` | = secondary-500 |
| `--error` | `#EF4444` | Rouge |
| `--warning` | `#F59E0B` | = accent-500 |
| `--info` | `#3B82F6` | Bleu |

#### Couleurs ERP (`apps/erp/globals.css` — Tailwind v4 OKLch)

L'ERP utilise l'espace colorimétrique **OKLch** (Tailwind CSS 4) — incompatible directement avec les hex du website.

| Variable | OKLch | Équivalent approx. |
|----------|-------|-------------------|
| `--primary` | `oklch(0.696 0.149 162.48)` | Emerald vert |
| `--secondary` | `oklch(0.972 0.004 264)` | Blanc cassé |
| `--accent` | `oklch(0.962 0.044 156.74)` | Vert pâle |
| `--background` (light) | `oklch(0.985 0.001 286)` | Quasi blanc |
| `--background` (dark) | `oklch(0.208 0.042 265.76)` | Bleu nuit |

#### Couleur dans `@effinor/ui` (Button hardcodé)

| Valeur | Usage |
|--------|-------|
| `#0f766e` | Background bouton primary (teal) |
| `#ccc` | Border bouton secondary |
| `#fff` | Texte bouton primary |
| `#111` | Texte bouton secondary |

> ⚠️ `#0f766e` ≈ `teal-700` Tailwind — **ne correspond à aucun token** des palettes website ou ERP.

#### Couleurs `apps/landing-destratification`

| Variable | Valeur HSL |
|----------|-----------|
| `--primary` | `221.2 83.2% 53.3%` (bleu) |
| `--background` | `0 0% 100%` |
| `--foreground` | `222.2 84% 4.9%` |
| Section hero | `linear-gradient(#F6F8FB → #FFFFFF)` |

> ⚠️ Palette **bleu** = complètement différente du green/slate du website et de l'ERP.

---

### 3.2 Typographies

| App | Police principale | Police titres | Police mono |
|-----|------------------|---------------|-------------|
| `website` | **Inter** | **Poppins** | SF Mono, Monaco, Cascadia Code, Roboto Mono |
| `erp` | **Geist** | Geist | Geist Mono |
| `landing-pac` | `system-ui, sans-serif` | — | — |
| `landing-destratification` | Système | Système | — |

> ⚠️ 3 familles de polices différentes selon les apps (Inter, Geist, system-ui).

---

### 3.3 Breakpoints responsive

Standard Tailwind (identiques dans toutes les apps) :

| Breakpoint | Valeur |
|------------|--------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px (Tailwind défaut) / 1440px (website custom) |

**Largeurs de conteneurs custom (website)**

| Token | Valeur |
|-------|--------|
| `effinorReadable` | 42rem |
| `effinorContent` | 48rem |
| `effinorHero` | 56rem |
| `effinorSite` | 80rem |

---

### 3.4 Border-radius

| Token | Valeur | Contexte |
|-------|--------|----------|
| `--radius-sm` | `0.375rem` (6px) | `enterprise-design-system.css` |
| `--radius-md` | `0.5rem` (8px) | |
| `--radius-lg` | `0.75rem` (12px) | |
| `--radius-xl` | `1rem` (16px) | |
| `--radius-2xl` | `1.5rem` (24px) | |
| `--radius-full` | `9999px` | Pill |
| `--radius` (ERP) | `0.5rem` | shadcn/ui variable |
| `--radius` (landing-destrat) | `0.5rem` | shadcn/ui variable |

---

### 3.5 Ombres

Définies dans `enterprise-design-system.css` (website) :

| Token | Valeur CSS |
|-------|-----------|
| `--shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` |
| `--shadow-inner` | `inset 0 2px 4px 0 rgba(0,0,0,0.05)` |

---

### 3.6 Espacements custom (website)

| Token Tailwind | Valeur |
|----------------|--------|
| `section-y` | `2.5rem` (40px) |
| `section-y-md` | `3.5rem` (56px) |
| `section-y-lg` | `5rem` (80px) |

Échelle d'espacement système (enterprise-design-system.css) :

`4px → 8px → 12px → 16px → 20px → 24px → 32px → 40px → 48px → 64px → 80px`

---

### 3.7 Transitions

| Token | Valeur |
|-------|--------|
| `--transition-fast` | `150ms cubic-bezier(0.4,0,0.2,1)` |
| `--transition-base` | `200ms cubic-bezier(0.4,0,0.2,1)` |
| `--transition-slow` | `300ms cubic-bezier(0.4,0,0.2,1)` |
| `--transition-slower` | `500ms cubic-bezier(0.4,0,0.2,1)` |

---

## 4. Configuration déploiement

### 4.1 Dockerfiles

| Fichier | App cible | Base image | Stratégie |
|---------|-----------|-----------|-----------|
| `/Dockerfile.erp` | ERP | `node:20-bookworm-slim` | Multi-stage (builder + runner), standalone Next.js + Playwright |
| `/apps/erp/Dockerfile` | ERP | `node:20-bookworm-slim` | Identique au précédent (doublon) |
| `/apps/website/Dockerfile` | Website | `node:20-alpine` | Single-stage, lance `vite preview` |
| `/apps/landing-pac/Dockerfile` | Landing-PAC | `node:20-alpine` + `nginx:alpine` | Multi-stage, SPA statique derrière nginx |

> ⚠️ **Doublon ERP** : `Dockerfile.erp` (racine) et `apps/erp/Dockerfile` sont quasi-identiques. Les commentaires indiquent de préférer le fichier racine pour Dokploy.  
> ⚠️ **Website** : lance `vite preview` en production — non adapté à un usage réel (prévisualisation Vite n'est pas un serveur de production).  
> ⚠️ **Landing-destratification** : aucun Dockerfile trouvé.

### 4.2 Docker Compose

Aucun fichier `docker-compose.yml` trouvé dans le monorepo.

### 4.3 Dokploy

Aucun fichier de config Dokploy (`.dokploy`, `dokploy.yml`) trouvé. La configuration est documentée dans les commentaires des Dockerfiles.

---

### 4.4 Variables d'environnement — ERP (`process.env`)

**Variables métier critiques (à documenter)**

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (server-only) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Alias server-side |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Chiffrement Server Actions |
| `OPENAI_API_KEY` | Clé OpenAI |
| `OPENAI_MODEL` / `OPENAI_CHAT_MODEL` / `OPENAI_COCKPIT_MODEL` | Modèles GPT par feature |
| `OPENAI_ERP_ASSISTANT_MODEL` | Modèle assistant ERP |
| `APIFY_TOKEN` / `APIFY_WEBHOOK_SECRET` | Scraping Apify |
| `LBC_SCRAPING_EMAIL` / `LBC_SCRAPING_PASSWORD` | Credentials LeBonCoin |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Email sortant |
| `SMTP_HOST` / `SMTP_FROM_EMAIL` | SMTP alternatif |
| `GOOGLE_MAPS_GEOCODING_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps |
| `SLACK_DEFAULT_WEBHOOK_URL` / `SLACK_COMMERCIAL_WEBHOOK_URL` | Notifications Slack |
| `SLACK_ADMIN_WEBHOOK_URL` | Alertes admin Slack |
| `CRON_SECRET` / `AUTOMATION_CRON_SECRET` | Sécurisation crons |
| `PAPPERS_API_KEY` | API données entreprises |
| `IMPERSONATION_COOKIE_SECRET` | Impersonation admin |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | URL de l'app |

**Variables IA / autonomie**

| Variable | Description |
|----------|-------------|
| `AI_OPS_AGENT_ENABLED` | Active l'agent ops autonome |
| `AI_OPS_AGENT_AUTONOMOUS_MODE` | Mode autonome (sans validation) |
| `AI_INTERNAL_SLA_ENABLED` | Calcul SLA par IA |
| `AI_ORCHESTRATOR_ACTOR_USER_ID` | User ID de l'orchestrateur IA |
| `OPENAI_QUALIFIED_LEAD_EMAIL_MODEL` | Modèle pour emails leads qualifiés |
| `QUALIFIED_LEAD_PROSPECT_EMAIL_ENABLED` | Envoi email auto prospects |

> ⚠️ **85 variables `process.env`** détectées — dont plusieurs qui semblent être des doublons (`SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL` vs `PUBLIC_SUPABASE_URL`).  
> ⚠️ Typo détectée : `OPEOPENAI_API_KEY` (= doublon cassé d'`OPENAI_API_KEY`).

---

### 4.5 Variables d'environnement — Apps Vite (`import.meta.env`)

| Variable | Apps concernées |
|----------|----------------|
| `VITE_SUPABASE_URL` | website, landing-pac |
| `VITE_SUPABASE_ANON_KEY` | website, landing-pac |
| `VITE_STRIPE_PUBLIC_KEY` | website |
| `VITE_GA_MEASUREMENT_ID` | website |
| `VITE_GTM_ID` | website |
| `VITE_GOOGLE_ADS_CONVERSION_SEND_TO` | website |
| `VITE_AIRTABLE_TOKEN` / `VITE_AIRTABLE_BASE_ID` | landing-destrat |
| `VITE_AIRTABLE_BLOG_TABLE` / `VITE_AIRTABLE_REALISATIONS_TABLE` | landing-destrat |
| `VITE_SIRENE_API_TOKEN` | website |
| `VITE_BACKUP_EMAIL` | landing-destrat |
| `VITE_LEAD_SOURCE_*` | website, landing-pac |
| `VITE_LOGO_URL` / `VITE_OG_IMAGE_URL` / `VITE_SITE_URL` | website |
| `VITE_DISABLE_SUPABASE_MINI_FORM_INSERT` | website |

---

### 4.6 Fichiers `.env.example` présents

| Fichier | Contenu |
|---------|---------|
| `/.env.example` | Supabase, App URL, OpenAI, email, Slack, automation, IA |
| `/.env.local.example` | Documentation complète (146 lignes) — source de vérité |
| `/apps/erp/.env.example` | Apify, LeBonCoin credentials, cron secrets, Google Maps |
| `/apps/website/.env.example` | Supabase URL + anon key uniquement |
| `/apps/landing-pac/.env.example` | Supabase URL + anon key uniquement |
| `/apps/landing-destratification/.env.example` | Supabase URL + anon key uniquement |

---

## 5. Recommandations

### 5.1 Faut-il garder ou refaire `@effinor/ui` et `@effinor/lib` ?

#### `@effinor/lib` — **Garder et enrichir**

La lib est saine : framework-agnostic, exports clairs, utile pour partager le client Supabase et `formatEuro`/`cn`. Points d'action :

- Aligner la version `@supabase/supabase-js` : lib déclare `^2.49.1`, ERP est à `^2.101.1` — bump la dépendance dans `packages/lib`.
- Ajouter les exports qui sont dupliqués dans plusieurs apps (formatters, validators communs).
- Créer des tests unitaires (zéro couverture actuellement).

#### `@effinor/ui` — **Refaire depuis zéro**

L'état actuel est inutilisable à grande échelle :

| Problème | Détail |
|---------|--------|
| 1 seul composant | `Button` uniquement |
| Style inline hardcodé | Couleur `#0f766e` hors charte |
| Pas de Tailwind | Incompatible avec les apps qui utilisent Tailwind |
| Non consommé par ERP ni website | Pas de validation réelle |
| Pas de Storybook ni tests | Aucun DX |

**Recommandation** : repartir sur shadcn/ui comme base (déjà utilisé dans l'ERP), exporter les composants configurés avec les tokens de design Effinor. Cible : partager Button, Input, Badge, Card, Dialog entre les apps qui le souhaitent.

---

### 5.2 Tokens de design à standardiser

Le monorepo souffre de **4 systèmes de design divergents**. Voici les décisions à prendre :

**Palette couleur**

| Décision | Recommandation |
|---------|----------------|
| Couleur primaire | Choisir entre Slate/Navy (`#0F172A`) du website et Emerald (`oklch(0.696 0.149 162.48)`) de l'ERP |
| Couleur secondaire | Unifier sur Emerald `#10B981` (déjà cohérent website + ERP) |
| Supprimer | `#0f766e` du Button dans `@effinor/ui` |
| Cas landing-destrat | Palette bleue isolée — décider si c'est intentionnel (branding différent) |

**Typographie**

| Décision | Recommandation |
|---------|----------------|
| Police principale | Choisir entre **Inter** (website) et **Geist** (ERP). Geist est plus moderne et mieux adapté aux SaaS. |
| Titres | Abandonner Poppins (website uniquement, peu utilisé) au profit de Geist |
| Mono | Geist Mono pour la cohérence |

**Versions techniques**

| App | Action requise |
|-----|---------------|
| `website` | Migrer Vite 4 → 6, React 18 → 19 |
| `landing-destratification` | Migrer Vite 4 → 6, React 18 → 19, corriger conflit port 3000 |
| `landing-pac` | Compléter (5 fichiers actuellement) |
| `website` Docker | Remplacer `vite preview` par un vrai serveur (nginx ou node) en production |

---

### 5.3 Pièges potentiels de la migration

| Piège | Risque | Mitigation |
|-------|--------|-----------|
| **85 variables `process.env` dans l'ERP** | Variables manquantes en prod silencieuses | Créer un schéma Zod de validation des env au démarrage (`@t3-oss/env-nextjs` ou équivalent) |
| **Typo `OPEOPENAI_API_KEY`** | Feature IA silencieusement désactivée en prod | Grep + corriger immédiatement |
| **Doublon Dockerfiles ERP** | Confusion sur lequel utiliser, divergence future | Supprimer `apps/erp/Dockerfile`, garder uniquement `Dockerfile.erp` à la racine |
| **Conflit port 3000** (`website` + `landing-destrat`) | Impossible de dev les deux simultanément | Attribuer un port fixe à `landing-destrat` (ex: `3004`) |
| **React 18 vs 19 dans `@effinor/ui`** | `peerDep ^19` mais `website` tourne en React 18 | Migrer `website` vers React 19 avant d'étendre `@effinor/ui` |
| **Tailwind v3 vs v4** | Breaking changes significatifs (API theme, config) | Ne pas migrer `website`/`landing-destrat` vers Tailwind v4 avant d'avoir un design system unifié |
| **`vite preview` en prod (website Docker)** | Non conçu pour la production, pas de compression, pas de cache headers | Migrer vers nginx (comme `landing-pac`) |
| **174 migrations SQL sans tests** | Migration schema = risque réel en prod | Ajouter des tests d'intégration DB avant la restructuration |
| **3 dossiers exclus du typecheck TypeScript** | Dette de type invisible | Inclure progressivement, corriger les erreurs |
| **`@supabase/supabase-js` version divergente** | `lib` en 2.49, ERP en 2.101 — API différente possible | Aligner sur la version ERP (la plus récente) |
| **`website` : `@supabase/supabase-js` pinné en `2.30.0`** | Très vieux (2023), incompatible avec les nouvelles features Supabase | Mettre à jour vers `^2.101` |
| **Backend PHP dans `landing-destratification`** | Hétérogénéité technologique, déploiement complexe | Clarifier si c'est maintenu ou si la feature doit être portée en Node/Edge |
| **Pas de `docker-compose.yml`** | Dev local multi-app difficile à orchestrer | Ajouter un `docker-compose.yml` racine pour le développement |

---

*Audit généré automatiquement par analyse statique du monorepo. Aucun fichier modifié.*