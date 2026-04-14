#!/bin/bash

# Script pour créer un ZIP de déploiement avec le build compilé pour Effinor
# Inclut le dossier dist/ pour un déploiement direct sans compilation

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du fichier ZIP avec date et heure
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ZIP_NAME="effinor-deploy-with-build-${TIMESTAMP}.zip"
TEMP_DIR="deploy-temp"

echo -e "${BLUE}📦 Création du package de déploiement Effinor (avec build)...${NC}"

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
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}📁 Copie des fichiers nécessaires...${NC}"

# Copier le dossier dist (build compilé) - C'EST LE PLUS IMPORTANT
cp -r dist "${TEMP_DIR}/"

# Copier les migrations SQL (utiles pour la base de données)
if [ -d "migrations" ]; then
    cp -r migrations "${TEMP_DIR}/" 2>/dev/null || true
fi

# Copier la configuration Supabase (si nécessaire)
if [ -d "supabase" ]; then
    cp -r supabase "${TEMP_DIR}/" 2>/dev/null || true
fi

# Créer un fichier README avec les instructions de déploiement
cat > "${TEMP_DIR}/README-DEPLOY.md" << 'EOF'
# Instructions de déploiement Effinor

## Déploiement avec build compilé

Ce package contient déjà le build compilé dans le dossier `dist/`.

### Option 1: Déploiement direct (recommandé)

1. Décompressez ce fichier ZIP sur votre serveur
2. Configurez votre serveur web (Apache/Nginx) pour servir le contenu du dossier `dist/`
3. Assurez-vous que le fichier `.htaccess` est présent dans le dossier `dist/` (pour Apache)
4. Configurez votre serveur pour rediriger toutes les requêtes vers `index.html` (pour le routing React)

### Configuration Apache (.htaccess)

Le fichier `.htaccess` devrait déjà être présent dans `dist/`. Il contient :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Configuration Nginx

Ajoutez dans votre configuration Nginx :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Variables d'environnement

Assurez-vous que les variables d'environnement suivantes sont configurées sur votre serveur :

- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme de Supabase
- `VITE_STRIPE_PUBLISHABLE_KEY` : Clé publique Stripe (si utilisée)
- `VITE_N8N_WEBHOOK_URL` : URL du webhook N8N (si utilisée)

### Migrations SQL

Si vous avez des migrations SQL à appliquer, elles se trouvent dans le dossier `migrations/`.
Exécutez-les dans l'ordre dans votre Supabase Dashboard > SQL Editor.

### Support

Pour toute question, contactez l'équipe de développement.
EOF

echo -e "${YELLOW}🗜️  Création du fichier ZIP...${NC}"

# Créer le ZIP
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

echo -e "${GREEN}✅ Package créé avec succès !${NC}"
echo -e "${GREEN}📦 Fichier: ${ZIP_NAME}${NC}"
echo -e "${GREEN}📊 Taille: ${FILE_SIZE}${NC}"
echo ""
echo -e "${BLUE}💡 Instructions de déploiement:${NC}"
echo -e "   1. Téléchargez le fichier ${ZIP_NAME}"
echo -e "   2. Décompressez-le sur votre serveur dans le dossier public_html (ou www)"
echo -e "   3. Copiez le contenu du dossier 'dist' à la racine de public_html"
echo -e "   4. OU configurez votre serveur web pour pointer vers le dossier 'dist'"
echo -e "   5. Assurez-vous que le fichier .htaccess est présent"
echo -e "   6. Configurez vos variables d'environnement sur le serveur"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo -e "   - Le dossier 'dist' contient le site compilé et prêt à être servi"
echo -e "   - Vérifiez que votre serveur web est configuré pour servir les fichiers statiques"
echo -e "   - Le routing React nécessite une redirection vers index.html"

