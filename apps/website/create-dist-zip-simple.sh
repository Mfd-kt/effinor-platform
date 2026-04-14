#!/bin/bash

# Script simple pour créer un ZIP avec uniquement le contenu de dist/
# (sans rebuilder, utilise le build existant)

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-dist-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création du ZIP avec le contenu de dist/...${NC}"

# Vérifier si le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le dossier 'dist' n'existe pas.${NC}"
    echo -e "${YELLOW}💡 Exécutez d'abord: npm run build${NC}"
    exit 1
fi

# Vérifier si dist contient des fichiers
if [ -z "$(ls -A dist)" ]; then
    echo -e "${RED}❌ Erreur: Le dossier 'dist' est vide.${NC}"
    echo -e "${YELLOW}💡 Exécutez d'abord: npm run build${NC}"
    exit 1
fi

# Créer un dossier temporaire
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}📁 Copie du contenu de dist/...${NC}"

# Copier TOUT le contenu de dist/ (y compris .htaccess — « dist/* » omet les fichiers cachés)
cp -a dist/. "${TEMP_DIR}/"

# Vérifier que index.html est présent
if [ ! -f "${TEMP_DIR}/index.html" ]; then
    echo -e "${RED}❌ Erreur: index.html n'est pas présent dans dist/${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Vérifier la taille de index.html
INDEX_SIZE=$(du -h "${TEMP_DIR}/index.html" | cut -f1)
echo -e "${GREEN}✅ index.html trouvé (${INDEX_SIZE})${NC}"

# Vérifier si .htaccess existe, sinon en créer un
if [ ! -f "${TEMP_DIR}/.htaccess" ]; then
    echo -e "${YELLOW}⚠️  .htaccess n'est pas présent, création d'un .htaccess par défaut...${NC}"
    cat > "${TEMP_DIR}/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
    echo -e "${GREEN}✅ .htaccess créé${NC}"
else
    echo -e "${GREEN}✅ .htaccess trouvé${NC}"
fi

# Créer un fichier README avec les instructions
cat > "${TEMP_DIR}/README-DEPLOY.txt" << 'EOF'
==========================================
INSTRUCTIONS DE DÉPLOIEMENT
==========================================

✅ Ce ZIP contient le build avec TOUTES les dernières modifications.

ÉTAPES DE DÉPLOIEMENT :

1. Décompressez ce fichier ZIP
2. Sélectionnez TOUS les fichiers et dossiers
3. Uploadez-les DIRECTEMENT dans public_html/
   ⚠️  PAS dans un sous-dossier !

STRUCTURE ATTENDUE SUR LE SERVEUR :

public_html/
├── index.html      ← Le bon index.html (4-5 KiB)
├── .htaccess      ← Configuration Apache
├── favicon.svg
├── assets/        ← JS et CSS compilés
│   ├── index-*.js
│   └── index-*.css
└── images/

⚠️  IMPORTANT :
   - Les fichiers doivent être à la RACINE de public_html/
   - Ne créez PAS de sous-dossier (pas de public_html/public_html/)
   - Ne mettez PAS les fichiers dans un dossier dist/

VÉRIFICATION :

✅ index.html doit faire environ 4-5 KiB (pas 501 B)
✅ .htaccess doit être présent
✅ Le dossier assets/ doit contenir les fichiers JS et CSS
✅ Le site doit s'afficher correctement

==========================================
EOF

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP
cd "${TEMP_DIR}"
zip -r "../${ZIP_NAME}" . \
  -x "*.DS_Store" \
  -x "*.log" \
  > /dev/null 2>&1

# Ajouter le README
zip -u "../${ZIP_NAME}" README-DEPLOY.txt > /dev/null 2>&1

cd ..

# Nettoyer le dossier temporaire
rm -rf "${TEMP_DIR}"

# Afficher la taille du fichier
FILE_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

# Compter les fichiers dans le ZIP
FILE_COUNT=$(unzip -l "${ZIP_NAME}" 2>/dev/null | tail -1 | awk '{print $2}')

echo ""
echo -e "${GREEN}✅ ZIP créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo -e "${GREEN}📄 Nombre de fichiers: ${FILE_COUNT}${NC}"
echo ""
echo -e "${BLUE}💡 Instructions de déploiement :${NC}"
echo -e "   1. Téléchargez ${ZIP_NAME}"
echo -e "   2. Décompressez-le"
echo -e "   3. Uploadez TOUS les fichiers DIRECTEMENT dans public_html/"
echo -e "   4. ⚠️  Ne créez PAS de sous-dossier !"
echo ""
echo -e "${YELLOW}📋 Contenu du ZIP :${NC}"
echo -e "   ✅ index.html (${INDEX_SIZE})"
echo -e "   ✅ .htaccess"
echo -e "   ✅ favicon.svg"
echo -e "   ✅ assets/ (JS et CSS compilés)"
echo -e "   ✅ images/"

