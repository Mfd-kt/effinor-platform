# Déploiement Effinor ERP sur VPS (Dokploy / Hostinger)

Le **Dockerfile** (`apps/erp/Dockerfile`) utilise **Node 20 bookworm-slim**, **Playwright/Chromium**, `npm run build -w @effinor/erp` et la sortie **standalone** (`output: "standalone"` dans `next.config.ts`).

> **Contexte Docker obligatoire** : la racine du dépôt **`effinor-platform`** (lockfile `package-lock.json` monorepo). Un contexte limité à `apps/erp` fait échouer `npm ci` (mauvais lockfile).

## Prérequis

1. **Supabase** (cloud ou auto-hébergé) : projet créé, migrations appliquées, URL + clés API.
2. **Dépôt Git** : code poussé sur GitHub / GitLab / Gitea (Dokploy clone le repo).
3. **VPS** : Dokploy installé (ex. Ubuntu + bouton « Gérer le panel » Hostinger).

## 1. Variables d’environnement (Dokploy)

### Supabase côté navigateur : deux options

Next.js **incline** souvent `process.env.NEXT_PUBLIC_*` **pendant** `npm run build`. Si Dokploy ne fournit ces variables qu’au **runtime** du conteneur, le bundle client peut rester vide — d’où une erreur du type « variables manquantes » et un bouton **Connexion…** bloqué.

**Option A (recommandée sur Dokploy)** : définir au **runtime** uniquement :

- `PUBLIC_SUPABASE_URL` — même valeur que l’URL du projet (tableau Supabase → API). *Alias acceptés côté serveur :* `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`.
- `PUBLIC_SUPABASE_ANON_KEY` — même valeur que la clé **anon**. *Alias :* `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`.

Le navigateur peut aussi récupérer ces valeurs via **`GET /api/public/supabase-config`** (lu au runtime dans le conteneur). Pour vérifier le déploiement : ouvrir `https://ton-domaine/api/public/supabase-config` — la réponse doit être `{"ok":true,"url":"...","anonKey":"..."}`. Un **503** avec `"ok":false` inclut **`envPresent`** : si toutes les clés sont `false`, les variables ne sont **pas** injectées dans le conteneur qui exécute Node (mauvaise appli Dokploy, section « runtime » ignorée, ou déploiement sans recharger l’env). Corriger dans Dokploy puis **redéployer**.

L’application les lit sur le serveur et les injecte dans le navigateur au chargement (pas besoin de build args pour ces deux-là). Le layout racine est en **rendu dynamique** pour que cette lecture se fasse à chaque requête dans le conteneur, et non une seule fois au `next build`. **Redéployer** après modification des variables.

**Option B** : garder `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` mais les rendre disponibles **pendant** `docker build` (*Build Arguments* / env de build). Le `Dockerfile` expose des `ARG` pour cela. Puis **Rebuild** l’image.

Tu peux aussi définir les deux familles de variables : le code préfère `PUBLIC_*` au runtime si présent.

### Liste des variables

Dans l’application Dokploy → **Environment**, ajouter au minimum :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `PUBLIC_SUPABASE_URL` | Oui* | URL du projet Supabase (*ou* `NEXT_PUBLIC_SUPABASE_URL` si bake au build) |
| `PUBLIC_SUPABASE_ANON_KEY` | Oui* | Clé anon (*ou* `NEXT_PUBLIC_SUPABASE_ANON_KEY` si bake au build) |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommandé | Création d’utilisateurs admin, webhooks serveur (runtime serveur) |
| `APP_URL` | **Fortement recommandé** | URL publique **https** du site, ex. `https://erp.effinor.app` — utilisée pour le **pixel de suivi d’ouverture** des emails et les liens (sans elle, le pixel peut pointer vers `http://` ou un mauvais hôte si les en-têtes proxy sont incomplets). |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Recommandé (Docker)** | Clé **stable** pour chiffrer les Server Actions. Générer une fois : `openssl rand -base64 32`. La définir pour l’étape **build** Docker **et** le **runtime** du conteneur (même valeur). Sans elle, erreurs du type *Server Action … was not found* après redeploy ou avec plusieurs réplicas. |

Optionnel selon les fonctionnalités utilisées (voir `.env.local.example`) :

- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_FROM_NAME` — envoi d’emails documents
- `OPENAI_API_KEY` — transcription / synthèse notes audio leads
- `NEXT_PUBLIC_SUPABASE_LEAD_MEDIA_BUCKET` — bucket Storage médias leads
- Variables **Slack** si notifications activées
- **Cron automation** : `AUTOMATION_CRON_SECRET` (ou `CRON_SECRET`) — voir le guide détaillé **[Cron Automation (Dokploy)](./automation-cron.md)** (URL, header, fréquence, tests `curl`, garde-fous).

Ne commitez jamais de secrets ; saisissez-les uniquement dans Dokploy.

## 2. Créer l’application dans Dokploy

1. Ouvrir le **panel Dokploy** (bouton « Gérer le panel » sur Hostinger).
2. **New application** (ou équivalent) → type **Docker** ou **Git + Dockerfile**.
3. **Repository** : URL Git + branche (ex. `main`).
4. **Build** : **Dockerfile** = **`Dockerfile.erp`** à la **racine** du dépôt (recommandé). Si vous pointez vers `apps/erp/Dockerfile`, vérifiez que le **contexte de build** est bien la racine du clone (pas seulement `apps/erp`) — sinon le build échoue avec des fichiers introuvables (`package-lock.json`, `packages/lib`, etc.).
5. **Port du conteneur** : **3000** (Next écoute sur `PORT`, défaut 3000).
6. **Commande de démarrage** : laisser **vide** pour utiliser la `CMD` du Dockerfile (`node .next/standalone/apps/erp/server.js`). Ne pas forcer `next start` — avec `output: "standalone"`, ce n’est pas le runtime prévu.
7. Coller les variables d’environnement (section ci-dessus). Pour **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** et les `ARG` du `Dockerfile`, vérifier que Dokploy les transmet aussi à l’étape **build** (pas seulement au conteneur final).
8. **Domaine** : attacher un domaine (ex. `erp.votredomaine.fr`) avec HTTPS (Let’s Encrypt intégré à Dokploy selon version).

## 3. Build & déploiement

- Lancer un **deploy** : le build peut prendre plusieurs minutes (npm ci + `next build` + Chromium).
- Sur un VPS 1 vCPU / 2 Go RAM, augmenter la mémoire ou le swap si le build OOM ; Hostinger permet souvent de monter le plan temporairement.

## 4. Après le déploiement

- Vérifier `https://votre-domaine/api/health` si une route health existe, ou la page d’accueil / login.
- Dans Supabase → **Authentication** → **URL configuration** :
  - **Site URL** : `https://erp.votredomaine.fr` (ton domaine réel).
  - **Redirect URLs** : ajouter `https://erp.votredomaine.fr/**` et `https://erp.votredomaine.fr/*` selon ce que propose l’UI (sinon cookies / session peuvent être incohérents après login).

## 5. Mises à jour

- Push sur la branche suivie → **Redeploy** dans Dokploy (ou webhook auto si configuré).

## Dépannage

- **Server Action … was not found** (ex. génération email OpenAI) : souvent **décalage de déploiement** — faire un **rechargement complet** de la page (`Ctrl+Shift+R` / vider le cache). En Docker, définir **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** (même valeur au build et au runtime, voir le tableau ci-dessus) puis **Rebuild**. Vérifier qu’une seule version du conteneur tourne après un deploy.
- **Login infini sur « Connexion… »** : vérifier `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (runtime) **ou** `NEXT_PUBLIC_*` présentes au build ; puis redéploiement / rebuild. Vérifier aussi l’URL / redirect URLs Supabase pour ton domaine de prod.
- **Compte `*.local`** : si `admin@effinor.local` n’existe que dans un seed **local**, crée le même utilisateur dans le projet Supabase **cloud** (ou utilise un compte réellement présent dans Auth).
- **PDF études qui échouent** : l’image Alpine n’embarque pas Chromium ; prévoir une image Playwright ou un service PDF externe.
- **Images Storage** : `next.config.ts` autorise `**.supabase.co` pour `/storage/**`. Si votre storage est sur un autre host, ajoutez un `remotePatterns` correspondant.
- **Corps des requêtes volumineux** : limite ~55 Mo côté Server Actions (médias lead) ; inversez-proxy (Traefik / Nginx) doit autoriser `client_max_body_size` suffisant devant le conteneur.
