# Configuration OAuth2 pour l'API Sirene INSEE

## 📋 Informations OAuth2 de votre application

D'après votre page "INTÉGRATION OAUTH2" sur le portail INSEE:

- **Client ID**: `a0fdd13d-b330-4028-808b-e43e7bbf7c0b`
- **Client Secret**: (à copier depuis votre page, masqué par des points)

## 🔧 Configuration dans Supabase

### Étape 1: Configurer les secrets dans Supabase Dashboard

1. Allez dans votre **Supabase Dashboard**
2. Naviguez vers **Settings** > **Database**
3. Trouvez la section **Custom Database Secrets** ou **Database Settings**
4. Ajoutez **deux secrets** :

   **Secret 1:**
   - Key: `app.sirene_client_id`
   - Value: `a0fdd13d-b330-4028-808b-e43e7bbf7c0b`

   **Secret 2:**
   - Key: `app.sirene_client_secret`
   - Value: `votre_client_secret_copié_depuis_la_page_oauth2`

### Étape 2: Via Supabase CLI (alternative)

```bash
supabase secrets set app.sirene_client_id=a0fdd13d-b330-4028-808b-e43e7bbf7c0b
supabase secrets set app.sirene_client_secret=votre_client_secret_ici
```

### Étape 3: Obtenir le Client Secret

1. Retournez sur la page OAuth2: https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670
2. Dans le champ "Client secret", il devrait y avoir un bouton pour révéler/copier le secret
3. Copiez cette valeur et utilisez-la comme valeur du secret `app.sirene_client_secret`

⚠️ **Important** : Le Client Secret est sensible, ne le partagez jamais publiquement.

## 🔄 Flow OAuth2 Client Credentials

La fonction SQL va maintenant:

1. **Obtenir un token OAuth2** en faisant un POST vers `https://api.insee.fr/token` avec:
   - `grant_type=client_credentials`
   - `client_id` (votre Client ID)
   - `client_secret` (votre Client Secret)

2. **Recevoir un `access_token`** valide (généralement 1 heure)

3. **Utiliser ce token** dans les requêtes API avec le header:
   - `Authorization: Bearer {access_token}`

4. **Cacher le token** (éviter de le régénérer à chaque requête) pour optimiser les performances

## ✅ Prochaines étapes

1. Appliquez la migration SQL mise à jour: `migrations/20260111_create_sirene_sql_functions.sql`
2. Configurez les deux secrets dans Supabase (Client ID + Client Secret)
3. Testez avec un SIREN valide depuis l'interface admin

## 🆘 Dépannage

### Erreur "Client ID ou Secret manquant"
→ Vérifiez que les deux secrets sont bien configurés avec les noms exacts:
- `app.sirene_client_id`
- `app.sirene_client_secret`

### Erreur "401 Unauthorized" lors de l'obtention du token
→ Vérifiez que le Client ID et Client Secret sont corrects (copiés depuis la page OAuth2)

### Erreur "Token invalide"
→ Le token peut avoir expiré. La fonction SQL régénère automatiquement le token si nécessaire.

