# 🚀 Instructions de déploiement - Build frais avec dernières modifications

## Script créé : `create-fresh-dist-zip.sh`

Ce script va :
1. ✅ Rebuilder automatiquement le projet avec les dernières modifications
2. ✅ Créer un ZIP avec uniquement le contenu de `dist/`
3. ✅ Inclure toutes les modifications récentes

## Utilisation

### Étape 1 : Exécuter le script

```bash
./create-fresh-dist-zip.sh
```

Le script va :
- Vérifier que Node.js et npm sont installés
- Installer les dépendances si nécessaire
- **Rebuilder le projet** avec `npm run build`
- Créer un ZIP avec le contenu de `dist/`

### Étape 2 : Si erreur de permissions avec .env

Si vous obtenez une erreur `EPERM: operation not permitted, open '.env'`, vous avez deux options :

#### Option A : Autoriser l'accès au fichier .env
```bash
chmod 644 .env
./create-fresh-dist-zip.sh
```

#### Option B : Utiliser les variables d'environnement système
Le script détectera l'absence de `.env` et vous demandera de continuer. Les variables d'environnement peuvent être définies dans votre shell.

### Étape 3 : Télécharger et déployer

1. **Téléchargez** le fichier ZIP créé (ex: `effinor-dist-fresh-20260107-XXXXXX.zip`)
2. **Décompressez-le** localement
3. **Uploadez TOUS les fichiers** directement dans `public_html/` sur votre serveur
4. ⚠️ **Ne créez PAS de sous-dossier !**

## Structure attendue sur le serveur

```
public_html/
├── index.html      ← 4-5 KiB (le bon, celui du build)
├── .htaccess      ← Configuration Apache
├── favicon.svg
├── assets/        ← JS et CSS compilés
│   ├── index-*.js
│   └── index-*.css
└── images/
```

## Vérifications après déploiement

✅ `index.html` fait environ 4-5 KiB (pas 501 B)  
✅ `.htaccess` est présent  
✅ Le dossier `assets/` contient les fichiers JS et CSS  
✅ Le site s'affiche correctement  
✅ Les grandes catégories apparaissent dans le menu  
✅ La page Produits & Solutions fonctionne avec les filtres  

## Modifications incluses dans ce build

- ✅ Page Produits & Solutions avec grandes catégories
- ✅ Page d'accueil refaite (économies d'énergie)
- ✅ Page À propos refaite
- ✅ Page Blog mise à jour
- ✅ Header avec mega-catégories
- ✅ Navigation catégories mise à jour
- ✅ Pages secteurs enrichies avec produits
- ✅ Affichage prix HT/TTC
- ✅ Et toutes les autres modifications récentes

## Alternative : Build manuel

Si le script ne fonctionne pas, vous pouvez builder manuellement :

```bash
# 1. Installer les dépendances
npm install

# 2. Builder le projet
npm run build

# 3. Créer le ZIP manuellement
cd dist
zip -r ../effinor-dist-manual.zip .
cd ..
```

Puis décompressez et uploadez le contenu de `dist/` dans `public_html/`.

