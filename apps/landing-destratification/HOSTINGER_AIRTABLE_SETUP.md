# Déploiement Hostinger + Airtable

Ce document explique comment déployer la landing sur un hébergement Hostinger (FTP + Apache/PHP) et configurer l'envoi des leads vers Airtable.

---

## 1. Prérequis

- Hébergement Hostinger avec **PHP 7.4+** et **cURL** activé.
- Accès FTP (ou File Manager Hostinger).
- Un **Personal Access Token (PAT)** Airtable avec les droits `data.records:write` sur la base cible.

---

## 2. Générer un token Airtable

1. Va sur [https://airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Crée un nouveau token avec :
   - **Scopes** : `data.records:write`
   - **Access** : la base `appMEv9QcW7M4vinn` (ou toutes les bases si tu préfères).
3. Copie le token (il commence par `pat...`).

---

## 3. Configurer les variables serveur (`.htaccess`)

Sur Hostinger, tu peux définir des variables d'environnement via `.htaccess` (à la racine du site, là où se trouve `index.html`).

Ajoute ces lignes **au début** de ton `.htaccess` :

```apache
# --- Variables Airtable (NE PAS COMMITER CE FICHIER AVEC LE TOKEN) ---
SetEnv AIRTABLE_TOKEN "pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SetEnv AIRTABLE_BASE_ID "appMEv9QcW7M4vinn"
SetEnv AIRTABLE_TABLE_ID "tbltoo8YJWPutfGU3"
```

> **Important** : remplace `pat_XXXX...` par ton vrai token.  
> Ne commite jamais ce fichier avec le token dans un repo public.

---

## 4. Configurer le rewrite pour React Router (SPA)

Toujours dans le même `.htaccess`, ajoute les règles de rewrite pour que les routes React (`/merci`, `/mentions-legales`, etc.) fonctionnent :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Ne pas réécrire les fichiers/dossiers existants
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Redirige tout vers index.html (SPA)
  RewriteRule ^ index.html [L]
</IfModule>
```

---

## 5. Exemple complet de `.htaccess`

```apache
# --- Variables Airtable ---
SetEnv AIRTABLE_TOKEN "pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SetEnv AIRTABLE_BASE_ID "appMEv9QcW7M4vinn"
SetEnv AIRTABLE_TABLE_ID "tbltoo8YJWPutfGU3"

# --- Rewrite SPA ---
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

# --- Sécurité basique ---
<FilesMatch "^\.">
  Require all denied
</FilesMatch>
```

---

## 6. Build et upload

1. **Build local** :
   ```bash
   npm run build
   ```
   Cela génère le dossier `dist/` avec tous les fichiers statiques + `api/lead.php`.

2. **Upload via FTP** :
   - Connecte-toi à ton hébergement Hostinger (FTP ou File Manager).
   - Upload le **contenu** du dossier `dist/` à la racine du site (ex: `public_html/`).
   - Assure-toi que le dossier `api/` et le fichier `api/lead.php` sont bien présents.

3. **Créer/modifier le `.htaccess`** directement sur le serveur (via File Manager) pour y mettre le token Airtable.

---

## 7. Vérification

1. Ouvre ton site (ex: `https://destratificateurs.groupe-effinor.fr/`).
2. Remplis le formulaire et soumets.
3. Vérifie dans Airtable que le lead apparaît.
4. Vérifie que la page `/merci` s'affiche et que la conversion Google Ads est déclenchée (via Google Tag Assistant ou la console).

---

## 8. Dépannage

| Problème | Solution |
|----------|----------|
| `500 Internal Server Error` sur `/api/lead.php` | Vérifie que PHP est activé et que cURL est disponible. Vérifie les logs Apache. |
| `Server misconfigured (missing token)` | Le token n'est pas défini dans `.htaccess` ou `SetEnv` n'est pas supporté. Essaie via `php.ini` ou contacte le support Hostinger. |
| `Invalid JSON body` | Le front n'envoie pas du JSON. Vérifie la console réseau. |
| `Airtable error: INVALID_PERMISSIONS` | Le token n'a pas les droits `data.records:write` sur cette base/table. |
| `Airtable error: UNKNOWN_FIELD_NAME` | Les noms de champs dans `lead.php` ne correspondent pas à ceux de ta table Airtable. Adapte les clés dans `$fields`. |

---

## 9. Mapping des champs Airtable

Le fichier `public/api/lead.php` envoie ces champs :

| Champ formulaire | Champ Airtable attendu |
|------------------|------------------------|
| `hauteur` | `Hauteur sous plafond` |
| `surface` | `Surface approximative` |
| `chauffe` | `Bâtiment chauffé ?` |
| `departement` | `Département` |
| `nom` | `Nom complet` |
| `societe` | `Société` |
| `email` | `Email` |
| `telephone` | `Téléphone` |

Si tes colonnes Airtable ont des noms différents, modifie le tableau `$fields` dans `lead.php`.

---

## 10. Sécurité

- **Ne jamais exposer le token Airtable côté client** (pas de `VITE_AIRTABLE_TOKEN`).
- Le token est lu côté serveur via `getenv('AIRTABLE_TOKEN')`.
- Un honeypot (`website`) est inclus pour bloquer les bots basiques.
- Pour une protection plus robuste, ajoute un rate-limit ou Cloudflare Turnstile.

---

Bonne mise en prod ! 🚀
