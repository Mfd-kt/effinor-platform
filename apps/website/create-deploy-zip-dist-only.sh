#!/bin/bash

# Script pour créer un ZIP avec UNIQUEMENT le contenu du dossier dist/
# Pour déploiement direct sans confusion

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-dist-only-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création du package DIST uniquement (pour déploiement direct)...${NC}"

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

# Copier TOUT le contenu de dist/ directement dans le dossier temporaire
# (pas le dossier dist lui-même, mais son contenu)
# IMPORTANT: dist/* n'inclut PAS les dotfiles (ex: .htaccess) → cassait le routing SPA en prod.
# On copie donc le contenu de dist/ via "dist/." pour inclure aussi les fichiers cachés.
cp -a dist/. "${TEMP_DIR}/"

# Créer un fichier README avec les instructions
cat > "${TEMP_DIR}/README-DEPLOY.txt" << 'EOF'
==========================================
INSTRUCTIONS DE DÉPLOIEMENT
==========================================

IMPORTANT : Ce ZIP contient UNIQUEMENT les fichiers à déployer.

ÉTAPES :

1. Décompressez ce fichier ZIP
2. Sélectionnez TOUS les fichiers et dossiers
3. Uploadez-les DIRECTEMENT dans public_html/
   (pas dans un sous-dossier !)

STRUCTURE ATTENDUE SUR LE SERVEUR :

public_html/
├── index.html
├── .htaccess
├── favicon.svg
├── assets/
│   ├── index-*.js
│   └── index-*.css
└── images/

⚠️  NE PAS créer de sous-dossier !
⚠️  Les fichiers doivent être à la RACINE de public_html/

VÉRIFICATION :

- index.html doit faire environ 4-5 KiB
- .htaccess doit être présent
- Le dossier assets/ doit contenir les fichiers JS et CSS
- Le site doit s'afficher correctement

==========================================
EOF

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP
cd "${TEMP_DIR}"
zip -r "../${ZIP_NAME}" . \
  -x "*.DS_Store" \
  -x "*.log" \
  > /dev/null 2>&1

cd ..

# Nettoyer le dossier temporaire
rm -rf "${TEMP_DIR}"

# Afficher la taille du fichier
FILE_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

echo -e "${GREEN}✅ Package créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo ""
echo -e "${BLUE}💡 Instructions :${NC}"
echo -e "   1. Téléchargez ${ZIP_NAME}"
echo -e "   2. Décompressez-le"
echo -e "   3. Uploadez TOUS les fichiers DIRECTEMENT dans public_html/"
echo -e "   4. ⚠️  Ne créez PAS de sous-dossier !"
echo ""
echo -e "${YELLOW}📋 Contenu du ZIP :${NC}"
echo -e "   ✅ index.html (le bon, celui du build)"
echo -e "   ✅ .htaccess"
echo -e "   ✅ favicon.svg"
echo -e "   ✅ assets/ (JS et CSS compilés)"
echo -e "   ✅ images/"
echo ""
echo -e "${RED}⚠️  ATTENTION :${NC}"
echo -e "   Ce ZIP contient UNIQUEMENT les fichiers du build."
echo -e "   Décompressez-le et uploadez le contenu à la RACINE de public_html/"

