#!/bin/bash

# Script pour créer un ZIP avec le contenu de dist/ incluant les dernières modifications
# Rebuild automatiquement le projet avant de créer le ZIP

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-dist-fresh-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création d'un ZIP avec le build frais (dernières modifications)...${NC}"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erreur: Node.js n'est pas installé.${NC}"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Erreur: npm n'est pas installé.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Rebuild du projet avec les dernières modifications...${NC}"

# Vérifier si .env existe
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Aucun fichier .env trouvé.${NC}"
    echo -e "${YELLOW}   Le build utilisera les variables d'environnement par défaut.${NC}"
    echo -e "${YELLOW}   Assurez-vous que les variables sont configurées dans votre environnement.${NC}"
    echo ""
    read -p "Continuer quand même ? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
        exit 1
    fi
fi

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances.${NC}"
        exit 1
    fi
fi

# Rebuild le projet
echo -e "${YELLOW}🔨 Build en cours...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build.${NC}"
    echo -e "${YELLOW}💡 Vérifiez les erreurs ci-dessus et réessayez.${NC}"
    exit 1
fi

# Vérifier si le dossier dist existe et contient des fichiers
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le dossier 'dist' n'a pas été créé.${NC}"
    exit 1
fi

if [ -z "$(ls -A dist)" ]; then
    echo -e "${RED}❌ Erreur: Le dossier 'dist' est vide après le build.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi !${NC}"

# Créer un dossier temporaire
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}📁 Copie du contenu de dist/...${NC}"

# Copier TOUT le contenu de dist/ (y compris les dotfiles comme .htaccess — « dist/* » ne les inclut pas)
cp -a dist/. "${TEMP_DIR}/"

# Vérifier que les fichiers essentiels sont présents
if [ ! -f "${TEMP_DIR}/index.html" ]; then
    echo -e "${RED}❌ Erreur: index.html n'est pas présent dans dist/${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

if [ ! -f "${TEMP_DIR}/.htaccess" ]; then
    echo -e "${YELLOW}⚠️  Avertissement: .htaccess n'est pas présent.${NC}"
    echo -e "${YELLOW}   Création d'un .htaccess par défaut...${NC}"
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
fi

# Créer un fichier README avec les instructions
cat > "${TEMP_DIR}/README-DEPLOY.txt" << 'EOF'
==========================================
INSTRUCTIONS DE DÉPLOIEMENT
==========================================

✅ Ce ZIP contient le build FRAIS avec TOUTES les dernières modifications.

ÉTAPES DE DÉPLOIEMENT :

1. Décompressez ce fichier ZIP
2. Sélectionnez TOUS les fichiers et dossiers
3. Uploadez-les DIRECTEMENT dans public_html/
   ⚠️  PAS dans un sous-dossier !

STRUCTURE ATTENDUE SUR LE SERVEUR :

public_html/
├── index.html      ← Le bon index.html (4-5 KiB)
├── .htaccess      ← Configuration Apache (fichier CACHÉ : commence par un point)
├── favicon.svg
├── assets/        ← JS et CSS compilés
│   ├── index-*.js
│   └── index-*.css
└── images/

⚠️  IMPORTANT :
   - Les fichiers doivent être à la RACINE de public_html/
   - Ne créez PAS de sous-dossier (pas de public_html/public_html/)
   - Ne mettez PAS les fichiers dans un dossier dist/
   - Fichiers FTP : activez « afficher les fichiers cachés » — sinon .htaccess est invisible

VÉRIFICATION :

✅ index.html doit faire environ 4-5 KiB (pas 501 B)
✅ .htaccess doit être présent
✅ Le dossier assets/ doit contenir les fichiers JS et CSS
✅ Le site doit s'afficher correctement

MODIFICATIONS INCLUSES DANS CE BUILD :

✅ Page Produits & Solutions avec grandes catégories
✅ Page d'accueil refaite (économies d'énergie)
✅ Page À propos refaite
✅ Page Blog mise à jour
✅ Header avec mega-catégories
✅ Navigation catégories mise à jour
✅ Pages secteurs enrichies avec produits
✅ Affichage prix HT/TTC
✅ Et toutes les autres modifications récentes

==========================================
EOF

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP
cd "${TEMP_DIR}"
zip -r "../${ZIP_NAME}" . \
  -x "*.DS_Store" \
  -x "*.log" \
  -x "README-DEPLOY.txt" \
  > /dev/null 2>&1

# Ajouter le README séparément pour qu'il soit visible
zip -u "../${ZIP_NAME}" README-DEPLOY.txt > /dev/null 2>&1

cd ..

# Nettoyer le dossier temporaire
rm -rf "${TEMP_DIR}"

# Afficher la taille du fichier
FILE_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

# Afficher la taille de index.html pour vérification
INDEX_SIZE=$(du -h "dist/index.html" | cut -f1)

echo ""
echo -e "${GREEN}✅ Package créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo -e "${GREEN}📄 index.html: ${INDEX_SIZE}${NC}"
echo ""
echo -e "${BLUE}💡 Instructions de déploiement :${NC}"
echo -e "   1. Téléchargez ${ZIP_NAME}"
echo -e "   2. Décompressez-le"
echo -e "   3. Uploadez TOUS les fichiers DIRECTEMENT dans public_html/"
echo -e "   4. ⚠️  Ne créez PAS de sous-dossier !"
echo ""
echo -e "${YELLOW}📋 Contenu du ZIP :${NC}"
echo -e "   ✅ index.html (build frais avec dernières modifications)"
echo -e "   ✅ .htaccess"
echo -e "   ✅ favicon.svg"
echo -e "   ✅ assets/ (JS et CSS compilés)"
echo -e "   ✅ images/"
echo ""
echo -e "${GREEN}🎉 Ce build inclut TOUTES les modifications récentes !${NC}"

