# Repartir de zéro — dernière version du dépôt

Procédure pour **recréer une install propre** (comme un clone neuf) puis **builder ERP + website** avec le code actuellement sur Git.

## 1. Dernière version Git

```bash
cd effinor-platform
git fetch origin
git checkout refonte/monorepo-nextjs   # ou la branche que vous déployez
git pull origin refonte/monorepo-nextjs
git log -1 --oneline                    # noter le SHA (doit matcher GitHub)
```

## 2. Supprimer les dépendances installées

À la **racine** du monorepo (là où est `package-lock.json`) :

```bash
rm -rf node_modules
# Si des dossiers node_modules traînent (rare) :
# find . -name node_modules -type d -prune -exec rm -rf {} +
```

Sous **Windows** (PowerShell) : supprimez manuellement le dossier `node_modules` à la racine.

## 3. Réinstaller (verrou strict)

```bash
npm ci
```

`npm ci` installe **exactement** ce qui est dans `package-lock.json` (reproductible, proche du Docker).

## 4. Variables d’environnement

Copier `.env.example` → `.env.local` à la racine si besoin, et renseigner au minimum ce que les apps Next attendent (voir README).

## 5. Build production des deux apps Next

```bash
npm run build:all
```

Équivalent à `build:erp` puis `build:website`. Si cette commande passe, la **CI GitHub** (`.github/workflows/ci.yml`) et un **Dockerfile** qui enchaîne les mêmes étapes ont de bonnes chances de réussir.

## 6. (Optionnel) Image Docker ERP

Depuis la **racine** du dépôt :

```bash
docker build -f Dockerfile.erp -t effinor-erp:local .
```

Passer les `ARG` / `ENV` attendus par le Dockerfile (Supabase, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, etc.) comme en production.

## 7. Dokploy

Une fois le push sur GitHub fait, le **rebuild** sur Dokploy repart des mêmes sources : aligner la **branche** sur celle du §1, puis **Redeploy** (ou rebuild sans cache). Voir [DEPLOY-DOKPLOY.md](./DEPLOY-DOKPLOY.md).
