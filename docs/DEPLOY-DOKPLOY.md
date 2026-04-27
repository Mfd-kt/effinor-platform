# Déployer la dernière version sur Dokploy (monorepo Effinor)

## Qui fait quoi

| Étape | Où |
|--------|-----|
| `git push` | Met le code sur **GitHub** uniquement. |
| Vérification build | **GitHub Actions** — workflow `CI` (`.github/workflows/ci.yml`), commande `npm run build:all`. Ça ne déploie **pas** sur le VPS. |
| Conteneur + image + URL publique | **Dokploy** (Docker sur ton serveur). |

Quand « d’habitude ça se met à jour tout seul », en général **Dokploy** est relié au dépôt (webhook ou polling) **et** suit la **branche** sur laquelle vous poussez (`main`, `refonte/monorepo-nextjs`, etc.). Un push ou un CI vert **ne lance jamais** le build sur Dokploy **tant qu’aucun** des mécanismes ci‑dessous n’est en place côté Dokploy (voir section suivante).

### Pourquoi le site Dokploy n’a pas bougé après le push

1. **Le workflow CI et Dokploy sont indépendants** : `npm run build:all` sur GitHub valide le code ; l’**image Docker** et le **démarrage** du conteneur se font **uniquement** sur le serveur quand **Dokploy** lance un build (déploiement).
2. **Sans intégration explicite**, un `git push` **ne** déclenche **pas** un déploiement sur le VPS. Il faut l’une des options :
   - **Déploiement manuel** : panel Dokploy → application **ERP** (ou **website**) → **Deploy** / **Redeploy** / **Rebuild** (souvent nécessaire si l’automatisation n’est pas configurée).
   - **Auto deploy Dokploy** : dans l’app → activer l’[auto deploy](https://docs.dokploy.com/docs/core/auto-deploy) et s’assurer que le **dépôt + la branche** dans Dokploy sont les mêmes que ceux que vous poussez. Avec **GitHub**, Dokploy peut brancher le dépôt : sans ça, ou si la branche ne correspond pas, aucun build ne part.
   - **Webhook** : URL fournie par Dokploy (souvent dans l’onglet **Deployments** / logs de déploiement) colée côté **GitHub** → *Settings* → *Webhooks* (événements push sur la branche voulue), **ou** utiliser le **job optionnel** décrit plus bas.
3. Vérifier dans les **logs de déploiement Dokploy** le **SHA** du commit cloné : s’il est plus vieux que sur GitHub, c’est en général un problème de **branche** ou l’**absence** de redéploiement après le push.

---

Ce dépôt est un **monorepo** : le **contexte Docker** doit toujours être la **racine** du clone (`effinor-platform/`, celui qui contient `package-lock.json`).

### Symptôme : `Ready in 0ms` (ou démarrage instantané) dans les logs

C’est l’indice le plus fiable : **Next.js** met en pratique **plusieurs secondes** avant d’indiquer qu’il est prêt. Un démarrage en **0 ms** signifie en général qu’**aucun build Next n’a eu lieu** pour ce déploiement : Dokploy a **rebindé l’ancien conteneur** / une **image en cache** sans reconstruire, ou l’étape de build a été **court-circuitée**.

Que faire : **pas seulement « Redeploy »** sur l’existant, mais un **Rebuild without cache** (ou équivalent) pour **forcer** `docker build` + `next build` à partir du dernier code. Puis vérifier dans les logs que l’image est bien **reconstruite** (étapes `npm ci`, `next build`, durées plausibles).

### Monorepo et ancienne config Dokploy (refonte / changement d’arborescence)

Un passage à la branche `refonte/monorepo-nextjs` change **chemins** et **Dockerfile** par rapport à un ancien dépôt « app seule à la racine ». Si l’appli Dokploy a encore l’**ancienne** config (mauvais répertoire, mauvais Dockerfile, mauvaise branche), le moteur peut se retrouver avec un build incohérent, réutiliser une **image d’avant** — d’où le **0 ms** et parfois des **variables d’environnement** qui semblent « manquantes » côté app alors qu’elles sont pourtant saisies (ancienne image, ancien binaire, cache).

Dans **Dokploy → ton application → General** (libellés selon version) :

| Champ (souvent) | **Effinor (ce dépôt)** | Piège classique |
|-----------------|------------------------|-----------------|
| **Branche** | Celle des pushes, ex. `refonte/monorepo-nextjs` | Branche jamais poussée → déploiement figé. |
| **Contexte de build** / **Root** / **Build path** | **Racine du dépôt cloné** (là où se trouvent `package-lock.json` et `Dockerfile.erp`) | Un répertoire **uniquement** `apps/erp` : le `Dockerfile.erp` **racine** exécute `npm ci` et copie le lockfile **à la racine** — un contexte limité à `apps/erp` **casse** le monorepo ou pousse des chemins vides, puis repli sur l’**ancien** conteneur. |
| **Chemin du Dockerfile** | `Dockerfile.erp` (fichier à la **racine** du repo) | L’ancien `Dockerfile` d’un seul app, ou seul `apps/erp/Dockerfile` **sans** contexte racine. |

Puis enchaîner avec **Rebuild without cache** une fois la config corrigée.

> **Rappel** : beaucoup de guides conseillent de mettre le « root » sur `apps/…` parce que le code s’y trouve. **Pour ce monorepo ce n’est pas le bon réglage** : le `Dockerfile.erp` **attend** le contexte **clone racine** (voir commentaire en tête de [`Dockerfile.erp`](../Dockerfile.erp) à la racine du dépôt).

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

**Repartir de zéro** (suppression de `node_modules` + `npm ci` + build complet) : [BUILD-FROM-SCRATCH.md](./BUILD-FROM-SCRATCH.md).

---

## Poussez le code, puis exigez un rebuild côté Dokploy

1. `git push origin <votre-branche>`
2. Ouvrir Dokploy → l’application concernée → **déploiement manuel** ou attendre le webhook.
3. Confirmer dans les **logs** que le **commit** cloné est le bon.

Sans étape 2, **aucun conteneur ne change** : le build peut être « vert » sur une ancienne image si le trigger n’a pas tourné.

---

## Option : déclencher Dokploy après le CI (GitHub Actions, webhook ERP)

Quand le CI a réussi sur un `push`, un job **optionnel** peut appeler l’**URL de webhook** de déploiement Dokploy (celle de votre application **ERP**), ce qui lance le même flux qu’un **Deploy** manuel. Ce n’est activé **que** si vous configurez le dépôt GitHub.

| Paramètre | Où le définir |
|------------|---------------|
| `DOKPLOY_ERP_DEPLOY_VIA_CI` | *Settings* → *Variables and secrets* → **Variable** = `true` (repository). |
| `DOKPLOY_ERP_DEPLOY_WEBHOOK` | **Secret** = URL fournie par Dokploy pour l’app ERP (onglet *Deployments* / auto deploy, selon votre version de Dokploy). |

Documentation officielle (webhook + branche) : [Auto deploy](https://docs.dokploy.com/docs/core/auto-deploy).

**Website** : dupliquer la logique avec une seconde variable/secret (ou un second webhook dans Dokploy) si vous voulez le même mode pour `apps/website`.
