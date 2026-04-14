# Guide de déploiement Effinor

## ⚠️ Problème : Le site ne s'affiche pas

Si le site ne s'affiche pas après le déploiement, voici les étapes à suivre :

## 1. Vérifier la structure des fichiers

Après avoir décompressé le ZIP sur votre serveur, la structure devrait être :

```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── index-*.js
│   └── index-*.css
├── images/
└── favicon.svg
```

**IMPORTANT** : Le contenu du dossier `dist/` doit être à la racine de `public_html/`, pas dans un sous-dossier.

## 2. Vérifier le fichier .htaccess

Le fichier `.htaccess` doit être présent à la racine de `public_html/` avec ce contenu :

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

**Si le fichier .htaccess n'existe pas ou est incorrect :**
1. Créez-le à la racine de `public_html/`
2. Copiez le contenu ci-dessus
3. Assurez-vous que les permissions sont correctes (644)

## 3. Vérifier les permissions des fichiers

Sur votre serveur, exécutez :

```bash
chmod 644 public_html/index.html
chmod 644 public_html/.htaccess
chmod 644 public_html/assets/*
chmod 755 public_html/assets
```

## 4. Vérifier la configuration Apache

Si vous utilisez Apache, assurez-vous que :
- Le module `mod_rewrite` est activé
- Les fichiers `.htaccess` sont autorisés (AllowOverride All)

## 5. Vérifier les variables d'environnement

Le site React a besoin de variables d'environnement. Vérifiez que dans `index.html`, les variables sont correctement injectées.

Si vous utilisez un fichier `.env` sur le serveur, créez-le avec :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Note** : Pour un build de production, les variables doivent être compilées dans le build. Si elles ne le sont pas, vous devrez rebuilder le projet avec les bonnes variables.

## 6. Vérifier les chemins des assets

Ouvrez `index.html` et vérifiez que les chemins des assets commencent par `/` (chemins absolus) :

```html
<script type="module" src="/assets/index-xxx.js"></script>
<link rel="stylesheet" href="/assets/index-xxx.css">
```

Si les chemins commencent par `./` ou `assets/`, ils doivent être changés en `/assets/`.

## 7. Tester l'accès direct

Testez ces URLs dans votre navigateur :
- `https://votre-domaine.com/` → Devrait afficher le site
- `https://votre-domaine.com/index.html` → Devrait afficher le site
- `https://votre-domaine.com/assets/index-xxx.js` → Devrait télécharger le fichier JS

Si le fichier JS ne se charge pas, vérifiez les permissions et les chemins.

## 8. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez les erreurs :
- Erreurs 404 : Fichiers manquants ou mauvais chemins
- Erreurs CORS : Problème de configuration serveur
- Erreurs de variables d'environnement : Variables manquantes

## 9. Solution rapide : Rebuild et redéployer

Si rien ne fonctionne :

1. **Localement**, exécutez :
   ```bash
   npm run build
   ```

2. **Vérifiez** que le dossier `dist/` contient tous les fichiers

3. **Créez un nouveau ZIP** avec le script :
   ```bash
   ./create-deploy-zip-with-build.sh
   ```

4. **Redéployez** le nouveau ZIP sur votre serveur

## 10. Configuration Nginx (si applicable)

Si vous utilisez Nginx au lieu d'Apache, ajoutez dans votre configuration :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /chemin/vers/public_html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Checklist de déploiement

- [ ] Le dossier `dist/` a été décompressé
- [ ] Le contenu de `dist/` est à la racine de `public_html/`
- [ ] Le fichier `.htaccess` est présent et correct
- [ ] Les permissions des fichiers sont correctes (644 pour fichiers, 755 pour dossiers)
- [ ] Les variables d'environnement sont configurées
- [ ] Le module `mod_rewrite` est activé (Apache)
- [ ] Les chemins des assets dans `index.html` sont absolus (`/assets/...`)
- [ ] Le site est accessible via `https://votre-domaine.com/`
- [ ] Le routing React fonctionne (tester plusieurs pages)

## Support

Si le problème persiste après avoir suivi ces étapes, vérifiez :
1. Les logs d'erreur du serveur web
2. La console du navigateur pour les erreurs JavaScript
3. Les logs de Supabase pour les erreurs d'API

