# Déployer la dernière version sur Dokploy (monorepo Effinor)

Ce dépôt est un **monorepo** : le **contexte Docker** doit toujours être la **racine** du clone (`effinor-platform/`, celui qui contient `package-lock.json`).

## Checklist rapide (si « rien ne change » en prod sans message d’erreur)

1. **Branche Git** dans Dokploy = celle où vous poussez (ex. `refonte/monorepo-nextjs` ou `main`).  
   Si Dokploy est sur `main` et que vous ne poussez que sur une autre branche, **le déploiement ne verra jamais vos commits**.

2. **Déclencher un nouveau build** après chaque push :  
   - bouton **Deploy** / **Redeploy** / **Rebuild** dans l’application Dokploy, **ou**  
   - webhook Git configuré vers Dokploy (sinon le push ne lance rien tout seul).

3. **Vérifier le SHA du commit** dans les logs de déploiement : il doit correspondre au dernier commit visible sur GitHub pour la branche choisie.

4. **Cache Docker** : si l’interface le propose, utiliser **Rebuild without cache** (ou équivalent) une fois pour forcer une image neuve à partir du dernier code.

5. **Deux applications** : une app Dokploy pour **l’ERP**, une pour le **website** — chacune avec le bon **Dockerfile** et la même branche si vous voulez la même fraîcheur de code.

---

## ERP (`Dockerfile.erp` à la racine)

| Paramètre Dokploy | Valeur |
|-------------------|--------|
| Dépôt | `https://github.com/Mfd-kt/effinor-platform.git` (ou votre fork) |
| Branche | ex. `refonte/monorepo-nextjs` — **identique** à celle utilisée en dev |
| Contexte de build | **Racine du dépôt** (pas `apps/erp`) |
| Fichier Docker | **`Dockerfile.erp`** (à la racine) |
| Port conteneur | **3000** |
| Commande de démarrage | **Vide** (la `CMD` du Dockerfile lance `node …/server.js` standalone) |

Détails variables d’environnement, Supabase, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` :  
→ [../apps/erp/docs/deployment-dokploy.md](../apps/erp/docs/deployment-dokploy.md)

## Website (`apps/website/Dockerfile`)

| Paramètre Dokploy | Valeur |
|-------------------|--------|
| Branche | La même que ci-dessus si vous déployez la même ref |
| Contexte de build | **Racine du dépôt** |
| Fichier Docker | **`apps/website/Dockerfile`** |
| Port | **3000** (vérifier la `EXPOSE` / `CMD` du fichier) |

Les `NEXT_PUBLIC_*` doivent être disponibles au **build** (build args / env de build) pour le bundle client, selon le Dockerfile.

---

## Vérifier en local avant de compter sur Dokploy

À la racine du monorepo :

```bash
npm run build:all
```

(`build:erp` + `build:website` — script défini dans `package.json` à la racine.)

---

## Poussez le code, puis exigez un rebuild côté Dokploy

1. `git push origin <votre-branche>`
2. Ouvrir Dokploy → l’application concernée → **déploiement manuel** ou attendre le webhook.
3. Confirmer dans les **logs** que le **commit** cloné est le bon.

Sans étape 2, **aucun conteneur ne change** : le build peut être « vert » sur une ancienne image si le trigger n’a pas tourné.
