#!/bin/bash

# Script pour créer un ZIP COMPLET de déploiement avec TOUTES les dernières modifications
# Inclut les fichiers source, migrations, et le build (si disponible)

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-deploy-complete-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création du package COMPLET de déploiement Effinor...${NC}"
echo -e "${YELLOW}⚠️  Ce package inclut les fichiers source pour rebuilder sur le serveur${NC}"

# Créer un dossier temporaire
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}📁 Copie des fichiers source (avec toutes les modifications récentes)...${NC}"

# Copier TOUS les fichiers source (pour pouvoir rebuilder)
cp -r src "${TEMP_DIR}/"
cp -r public "${TEMP_DIR}/"

# Copier les migrations SQL (TOUTES, y compris les récentes)
if [ -d "migrations" ]; then
    echo -e "${YELLOW}📦 Copie des migrations SQL...${NC}"
    cp -r migrations "${TEMP_DIR}/"
fi

# Copier les plugins
if [ -d "plugins" ]; then
    cp -r plugins "${TEMP_DIR}/"
fi

# Copier la configuration Supabase
if [ -d "supabase" ]; then
    cp -r supabase "${TEMP_DIR}/"
fi

# Copier les fichiers de configuration essentiels
echo -e "${YELLOW}📋 Copie des fichiers de configuration...${NC}"
cp package.json "${TEMP_DIR}/" 2>/dev/null || true
cp package-lock.json "${TEMP_DIR}/" 2>/dev/null || true
cp vite.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp tailwind.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp postcss.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp index.html "${TEMP_DIR}/" 2>/dev/null || true
cp README.md "${TEMP_DIR}/" 2>/dev/null || true

# Copier le build existant (même s'il est ancien, c'est mieux que rien)
if [ -d "dist" ] && [ -n "$(ls -A dist 2>/dev/null)" ]; then
    echo -e "${YELLOW}📦 Copie du build existant (peut être ancien, sera mis à jour après rebuild)...${NC}"
    cp -r dist "${TEMP_DIR}/"
fi

# Copier les fichiers de données
if [ -d "src/data" ]; then
    echo -e "${YELLOW}📊 Copie des fichiers de données (megaCategories, etc.)...${NC}"
    # Déjà inclus dans src/, mais on s'assure
fi

# Créer un fichier README avec les instructions complètes
cat > "${TEMP_DIR}/README-DEPLOY-COMPLETE.md" << 'EOF'
# Instructions de déploiement COMPLET Effinor

## ⚠️ IMPORTANT : Ce package contient les fichiers SOURCE

Ce package inclut les fichiers source pour que vous puissiez rebuilder le projet sur votre serveur avec les dernières modifications.

## Option 1 : Déploiement avec rebuild (RECOMMANDÉ)

### Sur votre serveur :

1. **Décompressez** ce fichier ZIP
2. **Installez Node.js** (version 18 ou supérieure) si ce n'est pas déjà fait
3. **Installez les dépendances** :
   ```bash
   npm install
   ```

4. **Configurez les variables d'environnement** :
   Créez un fichier `.env` à la racine avec :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_N8N_WEBHOOK_URL=https://votre-webhook.n8n.io
   ```

5. **Build le projet** :
   ```bash
   npm run build
   ```

6. **Déployez le dossier dist/** :
   - Copiez tout le contenu de `dist/` dans votre `public_html/`
   - OU configurez votre serveur web pour pointer vers le dossier `dist/`

## Option 2 : Déploiement direct (si build inclus)

Si le dossier `dist/` est présent dans ce package :

1. **Décompressez** ce fichier ZIP
2. **Copiez** tout le contenu de `dist/` dans votre `public_html/`
3. **Vérifiez** que le fichier `.htaccess` est présent
4. **Configurez** vos variables d'environnement sur le serveur

⚠️ **Note** : Si le build est ancien, utilisez l'Option 1 pour avoir les dernières modifications.

## Migrations SQL

Les migrations SQL se trouvent dans le dossier `migrations/`.

**Pour appliquer les migrations récentes** :

1. Ouvrez votre Supabase Dashboard
2. Allez dans SQL Editor
3. Exécutez les migrations dans l'ordre (par date) :
   - `20260104_create_destratificateurs_category_and_products.sql`
   - `20260106_add_mega_categorie_to_categories.sql`
   - `20260106_create_vmc_tertiaire_category_and_products.sql`
   - `20260107_create_product_sectors_table.sql`

## Fichiers modifiés récemment inclus

Ce package inclut TOUS les fichiers modifiés récemment :
- ✅ `src/pages/ProduitsSolutions.jsx` - Page produits avec grandes catégories
- ✅ `src/pages/Home.jsx` - Page d'accueil refaite (économies d'énergie)
- ✅ `src/pages/About.jsx` - Page À propos refaite
- ✅ `src/pages/BlogList.jsx` - Page Blog mise à jour
- ✅ `src/components/Header.jsx` - Header avec mega-catégories
- ✅ `src/components/home/HomeCategoryNav.jsx` - Navigation catégories
- ✅ `src/data/megaCategories.js` - Configuration grandes catégories
- ✅ `src/pages/CategoryDetail.jsx` - Pages secteurs enrichies
- ✅ Et tous les autres fichiers modifiés

## Vérification après déploiement

1. ✅ Le site s'affiche correctement
2. ✅ Les grandes catégories apparaissent dans le menu
3. ✅ La page Produits & Solutions fonctionne avec les filtres
4. ✅ Les pages secteurs affichent les produits associés
5. ✅ Les prix s'affichent en HT avec TTC en petit

## Support

Pour toute question, consultez le fichier `GUIDE-DEPLOIEMENT.md` pour le dépannage.
EOF

# Créer aussi un script de build pour le serveur
cat > "${TEMP_DIR}/build-on-server.sh" << 'EOF'
#!/bin/bash
# Script pour builder le projet sur le serveur

echo "📦 Installation des dépendances..."
npm install

echo "🔨 Build du projet..."
npm run build

echo "✅ Build terminé ! Le dossier 'dist' contient le site compilé."
echo "📁 Copiez le contenu de 'dist/' dans votre public_html/"
EOF

chmod +x "${TEMP_DIR}/build-on-server.sh"

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP en excluant uniquement les fichiers vraiment inutiles
cd "${TEMP_DIR}"
zip -r "../${ZIP_NAME}" . \
  -x "*.DS_Store" \
  -x "*/.git/*" \
  -x "*/node_modules/*" \
  -x "*/.env*" \
  -x "*/.vscode/*" \
  -x "*/.idea/*" \
  -x "*/.cursor/*" \
  -x "*/.supabase/*" \
  -x "*/coverage/*" \
  -x "*.log" \
  -x "*.swp" \
  -x "*.swo" \
  -x "*~" \
  > /dev/null 2>&1

cd ..

# Nettoyer le dossier temporaire
rm -rf "${TEMP_DIR}"

# Afficher la taille du fichier
FILE_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

echo -e "${GREEN}✅ Package COMPLET créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo ""
echo -e "${BLUE}📋 Contenu inclus :${NC}"
echo -e "   ✅ Tous les fichiers source (src/)"
echo -e "   ✅ Toutes les migrations SQL récentes"
echo -e "   ✅ Fichiers de configuration"
echo -e "   ✅ Build existant (si disponible)"
echo -e "   ✅ Script de build pour le serveur"
echo ""
echo -e "${YELLOW}💡 Instructions :${NC}"
echo -e "   1. Téléchargez ${ZIP_NAME}"
echo -e "   2. Décompressez sur votre serveur"
echo -e "   3. Exécutez: npm install"
echo -e "   4. Configurez .env avec vos variables"
echo -e "   5. Exécutez: npm run build"
echo -e "   6. Copiez dist/ dans public_html/"
echo ""
echo -e "${RED}⚠️  IMPORTANT :${NC}"
echo -e "   Ce package contient les FICHIERS SOURCE avec TOUTES les modifications récentes."
echo -e "   Vous DEVEZ rebuilder le projet sur le serveur pour avoir les dernières modifications."

