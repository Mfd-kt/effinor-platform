# Configuration de la fonction SQL pour l'API Sirene INSEE

## Solution SQL au lieu de Edge Function

Au lieu d'utiliser une Supabase Edge Function, nous utilisons une **fonction SQL PostgreSQL** qui appelle l'API Sirene INSEE directement depuis la base de données en utilisant l'extension `pg_net`.

## Avantages

- ✅ Pas besoin de déployer de Edge Function séparée
- ✅ Gestion centralisée dans la base de données
- ✅ Pas de problème CORS (les appels sont faits côté serveur)
- ✅ Utilisation de l'extension `pg_net` déjà disponible dans Supabase

## Étapes de configuration

### 1. Appliquer la migration SQL

Exécutez la migration `migrations/20260111_create_sirene_sql_functions.sql` dans votre base de données Supabase :

**Via le Dashboard Supabase :**
1. Allez dans **SQL Editor** > **New Query**
2. Copiez le contenu du fichier `migrations/20260111_create_sirene_sql_functions.sql`
3. Exécutez la requête

**Via Supabase CLI :**
```bash
supabase db push
```

**Via psql directement :**
```bash
psql -h [votre-host] -U postgres -d postgres -f migrations/20260111_create_sirene_sql_functions.sql
```

### 2. Activer l'extension pg_net (si nécessaire)

L'extension `pg_net` est généralement déjà activée dans Supabase. Si ce n'est pas le cas :

1. Allez dans **Database** > **Extensions** dans le Dashboard Supabase
2. Recherchez `pg_net`
3. Activez l'extension

Ou via SQL :
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3. Configurer le secret API Key

Vous devez configurer la **clé API** de l'API Sirene INSEE comme secret Supabase :

**⚠️ IMPORTANT** : L'API Sirene utilise `X-INSEE-Api-Key-Integration` comme header (pas OAuth2 Bearer)

**Via le Dashboard Supabase :**
1. Allez dans **Settings** > **Database**
2. Trouvez la section **Custom Database Secrets** ou **Database Settings**
3. Ajoutez un nouveau secret :
   - Key: `app.sirene_api_key` (ou `app.sirene_api_token` pour compatibilité)
   - Value: `votre_cle_api_sirene`

**Via Supabase CLI :**
```bash
supabase secrets set app.sirene_api_key=votre_cle_api_sirene
```

**Via SQL (méthode alternative - temporaire, pas recommandé pour la prod) :**
```sql
ALTER DATABASE postgres SET app.sirene_api_key = 'votre_cle_api_sirene';
```

⚠️ **Important** : Obtenez votre clé API sur https://portail-api.insee.fr/ après avoir :
1. Créé un compte sur https://portail-api.insee.fr/
2. **Souscrit** à l'API Sirene dans le catalogue (cliquez sur "SOUSCRIRE" dans la page de l'API : https://portail-api.insee.fr/catalog/api/2ba0e549-5587-3ef1-9082-99cd865de66f)
3. Généré une **clé d'intégration** (API Key) dans votre espace
4. Cette clé est automatiquement utilisée dans le header `X-INSEE-Api-Key-Integration` par la fonction SQL

**Documentation API complète :** https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content

### 4. Tester la fonction

Vous pouvez tester la fonction directement via SQL :

```sql
SELECT * FROM get_sirene_data_for_lead('907547665');
```

Ou depuis le frontend (déjà implémenté dans le code) :
```javascript
const { data, error } = await supabase.rpc('get_sirene_data_for_lead', {
  p_siren: '907547665'
});
```

## Utilisation dans le code frontend

Le code frontend utilise maintenant automatiquement la fonction SQL via `supabase.rpc('get_sirene_data_for_lead')`. Le fichier `src/lib/api/sirene.js` a été mis à jour pour utiliser cette approche.

Aucune modification supplémentaire n'est nécessaire côté frontend une fois la migration appliquée et le secret configuré.

## Dépannage

### Erreur "function get_sirene_data_for_lead does not exist"
- Vérifiez que la migration SQL a été appliquée correctement
- Vérifiez que vous êtes connecté à la bonne base de données
- Exécutez `\df get_sirene_data_for_lead` pour voir si la fonction existe

### Erreur "Clé API Sirene non configurée"
- Vérifiez que le secret `app.sirene_api_key` (ou `app.sirene_api_token` pour compatibilité) est bien configuré
- Vérifiez le nom exact du secret (sensible à la casse)
- **Important** : Utilisez la clé d'intégration obtenue après souscription sur https://portail-api.insee.fr/, pas un token OAuth2
- Essayez de réinitialiser le secret si nécessaire

### Erreur "extension pg_net does not exist"
- Activez l'extension `pg_net` dans le Dashboard Supabase > Database > Extensions
- Ou exécutez : `CREATE EXTENSION IF NOT EXISTS pg_net;`

### Erreur "permission denied for function"
- Vérifiez que les permissions GRANT ont été appliquées
- Ré-exécutez : `GRANT EXECUTE ON FUNCTION public.get_sirene_data_for_lead(TEXT) TO authenticated;`

### Erreur lors de l'appel HTTP
- Vérifiez que le token OAuth2 est valide
- Vérifiez que vous n'avez pas dépassé la limite de 30 requêtes/minute
- Vérifiez que l'URL de l'API est correcte

## Notes importantes

- **Limite de requêtes** : L'API Sirene limite à 30 requêtes par minute. La fonction SQL respecte cette limite.
- **Performance** : Les appels HTTP via `pg_net` sont asynchrones. La fonction utilise une boucle d'attente avec `net.http_get_completed` pour récupérer la réponse. Un timeout de 10 secondes est configuré pour éviter les attentes infinies.
- **Gestion d'erreurs** : La fonction gère les erreurs HTTP (404, 401, 429, etc.) et retourne des messages d'erreur clairs.
- **Données partielles** : Si l'établissement siège ne peut pas être récupéré, les données de l'unité légale sont quand même retournées.
- **Extension pg_net** : Si vous obtenez une erreur indiquant que `net.http_get_completed` n'existe pas, cela signifie que votre version de Supabase utilise une version différente de `pg_net`. Dans ce cas, contactez le support Supabase ou utilisez une Supabase Edge Function à la place.

## Migration depuis Edge Function

Si vous aviez déjà configuré la Edge Function, vous pouvez maintenant :
1. Supprimer la Edge Function (optionnel) : `supabase functions delete fetch-sirene-data`
2. Appliquer la migration SQL
3. Configurer le secret `app.sirene_api_token`
4. Tester la fonction SQL

Le code frontend a déjà été mis à jour pour utiliser la fonction SQL au lieu de la Edge Function.

