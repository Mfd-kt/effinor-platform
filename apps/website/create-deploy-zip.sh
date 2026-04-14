#!/bin/bash

# Script pour créer un ZIP de déploiement pour Effinor
# Exclut les fichiers de développement et inclut uniquement les fichiers nécessaires

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-deploy-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création du package de déploiement Effinor...${NC}"

# Créer un dossier temporaire
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}📁 Copie des fichiers nécessaires...${NC}"

# Copier les fichiers et dossiers essentiels
cp -r src "${TEMP_DIR}/"
cp -r public "${TEMP_DIR}/"
cp -r migrations "${TEMP_DIR}/" 2>/dev/null || true
cp -r plugins "${TEMP_DIR}/" 2>/dev/null || true
cp -r supabase "${TEMP_DIR}/" 2>/dev/null || true

# Copier les fichiers de configuration
cp package.json "${TEMP_DIR}/" 2>/dev/null || true
cp package-lock.json "${TEMP_DIR}/" 2>/dev/null || true
cp vite.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp tailwind.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp postcss.config.js "${TEMP_DIR}/" 2>/dev/null || true
cp index.html "${TEMP_DIR}/" 2>/dev/null || true
cp README.md "${TEMP_DIR}/" 2>/dev/null || true

# Créer le fichier .gitignore dans le dossier temporaire pour éviter d'inclure des fichiers indésirables
cat > "${TEMP_DIR}/.gitignore" << EOF
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Cursor
.cursor/

# Supabase
.supabase/

# Local development
*.local
EOF

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP en excluant les fichiers indésirables
cd "${TEMP_DIR}"
zip -r "../${ZIP_NAME}" . \
  -x "*.DS_Store" \
  -x "*/.git/*" \
  -x "*/node_modules/*" \
  -x "*/.env*" \
  -x "*/.vscode/*" \
  -x "*/.idea/*" \
  -x "*/dist/*" \
  -x "*/build/*" \
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

echo -e "${GREEN}✅ Package créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo ""
echo -e "${BLUE}💡 Pour déployer:${NC}"
echo -e "   1. Téléchargez le fichier ${ZIP_NAME}"
echo -e "   2. Décompressez-le sur votre serveur"
echo -e "   3. Exécutez: npm install"
echo -e "   4. Exécutez: npm run build"
echo -e "   5. Configurez votre serveur web pour servir le dossier 'dist'"

