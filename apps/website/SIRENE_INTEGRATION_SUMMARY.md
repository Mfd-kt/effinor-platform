# Résumé de l'intégration API Sirene INSEE

## ✅ Implémentation terminée

L'intégration de l'API Sirene INSEE a été complétée avec une solution SQL PostgreSQL utilisant l'extension `pg_net` pour contourner les problèmes CORS.

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`migrations/20260111_create_sirene_sql_functions.sql`**
   - Crée les fonctions SQL PostgreSQL pour appeler l'API Sirene
   - Fonctions principales :
     - `parse_unite_legale_sirene()` : Parse le JSON de l'unité légale
     - `parse_etablissement_sirene()` : Parse le JSON de l'établissement
     - `fetch_sirene_data_by_siren()` : Fonction principale qui appelle l'API
     - `get_sirene_data_for_lead()` : Wrapper simplifiée pour RPC frontend

2. **`SIRENE_SQL_SETUP.md`**
   - Guide de configuration complet
   - Instructions pour appliquer la migration
   - Configuration du secret `app.sirene_api_token`
   - Guide de dépannage

3. **`SIRENE_INTEGRATION_SUMMARY.md`** (ce fichier)
   - Résumé de l'intégration

### Fichiers modifiés

1. **`src/lib/api/sirene.js`** (anciennement `pappers.js`)
   - Migration de Pappers vers Sirene INSEE
   - Utilise maintenant `supabase.rpc('get_sirene_data_for_lead')` au lieu d'appels HTTP directs
   - Fonction `fetchCompanyBySiren()` mise à jour pour utiliser la fonction SQL
   - Fonction `mapSireneToLead()` mise à jour pour gérer le format de réponse SQL

2. **`src/components/leads/LeadDetails/CompanySection.jsx`**
   - Import mis à jour : `fetchCompanyBySiren` et `mapSireneToLead` depuis `@/lib/api/sirene`
   - Variables renommées : `loadingPappers` → `loadingSirene`, `handleFetchFromPappers` → `handleFetchFromSirene`
   - Messages d'erreur mis à jour pour mentionner "répertoire Sirene (INSEE)"
   - Tooltip mis à jour

3. **`README.md`**
   - Documentation mise à jour pour mentionner `VITE_SIRENE_API_TOKEN` (maintenant optionnel car géré côté serveur)
   - Note sur l'utilisation de la fonction SQL

4. **`SIRENE_EDGE_FUNCTION_SETUP.md`**
   - Marqué comme déprécié
   - Redirige vers `SIRENE_SQL_SETUP.md`

## 🔧 Configuration requise

### 1. Appliquer la migration SQL

Exécutez la migration dans votre base de données Supabase :

```sql
-- Via SQL Editor dans Supabase Dashboard
-- Copiez et exécutez le contenu de migrations/20260111_create_sirene_sql_functions.sql
```

### 2. Activer l'extension pg_net (si nécessaire)

Dans Supabase Dashboard > Database > Extensions, activez `pg_net`.

Ou via SQL :
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3. Configurer le secret API Token

**Important** : 
- La clé API doit être configurée comme secret Supabase, pas comme variable d'environnement frontend
- L'API Sirene utilise `X-INSEE-Api-Key-Integration` comme header (pas OAuth2 Bearer)
- Vous devez obtenir une **clé d'intégration** (API Key) après souscription, pas un token OAuth2

**Via Dashboard Supabase :**
1. Settings > Database
2. Section "Custom Database Secrets" ou "Database Settings"
3. Ajoutez : `app.sirene_api_key` = `votre_cle_api_sirene`

**Via Supabase CLI :**
```bash
supabase secrets set app.sirene_api_key=votre_cle_api_sirene
```

**Obtenir la clé API :**
1. Créez un compte sur https://portail-api.insee.fr/
2. **Souscrivez** à l'API Sirene dans le catalogue (bouton "SOUSCRIRE" sur la page de l'API)
3. Générez une **clé d'intégration** (API Key) dans votre espace
4. Cette clé est à utiliser dans le header `X-INSEE-Api-Key-Integration` (géré automatiquement par la fonction SQL)
5. Limite : 30 requêtes par minute (usage open data gratuit)

**Documentation API :** https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content

## 🚀 Utilisation

### Depuis le frontend

Le code frontend est déjà configuré. Le bouton "Récupérer" dans la section "Société" du détail d'un lead appelle automatiquement :

```javascript
supabase.rpc('get_sirene_data_for_lead', { p_siren: '907547665' })
```

### Tester manuellement via SQL

```sql
SELECT * FROM get_sirene_data_for_lead('907547665');
```

## 📊 Données mappées

La fonction SQL mappe automatiquement :

| Champ API Sirene | Champ Lead | Notes |
|-----------------|------------|-------|
| `uniteLegale.siren` | `siren` | Direct |
| `periodesUniteLegale[0].denominationUniteLegale` | `societe` | Raison sociale |
| `SIREN + nicSiegeUniteLegale` | `siret` | SIRET du siège (14 chiffres) |
| `periodesEtablissement[0].numeroVoieEtablissement + ...` | `adresse_siege` | Adresse complète |
| `periodesEtablissement[0].libelleCommuneEtablissement` | `ville_siege` | Ville |
| `periodesEtablissement[0].codePostalEtablissement` | `code_postal_siege` | Code postal |

**Note** : Si `code_postal_siege` est rempli, le trigger SQL existant calcule automatiquement `region` et `zone_climatique`.

## ⚠️ Limitations et notes

1. **Extension pg_net** : Si `net.http_get_completed` n'existe pas dans votre version de Supabase, contactez le support ou utilisez une Edge Function comme solution alternative.

2. **Performance** : Les appels HTTP via `pg_net` sont asynchrones avec une boucle d'attente (timeout 10 secondes). Cela peut ralentir l'exécution de la fonction si l'API est lente.

3. **Limite de requêtes** : Respecter la limite de 30 requêtes/minute de l'API Sirene.

4. **Gestion d'erreurs** : La fonction gère les erreurs HTTP (404, 401, 429, etc.) et retourne des messages clairs.

5. **Données partielles** : Si l'établissement siège ne peut pas être récupéré, les données de l'unité légale sont quand même retournées.

## 🔍 Dépannage

### Erreur "function get_sirene_data_for_lead does not exist"
→ Appliquez la migration SQL `migrations/20260111_create_sirene_sql_functions.sql`

### Erreur "Clé API Sirene non configurée"
→ Configurez le secret `app.sirene_api_key` (ou `app.sirene_api_token` pour compatibilité) dans Supabase Dashboard > Settings > Database
→ **Important** : Utilisez la clé d'intégration obtenue après souscription sur https://portail-api.insee.fr/, pas un token OAuth2

### Erreur "extension pg_net does not exist"
→ Activez l'extension `pg_net` dans Supabase Dashboard > Database > Extensions

### Erreur "net.http_get_completed does not exist"
→ Votre version de Supabase n'a pas cette fonction. Contactez le support Supabase ou utilisez une Edge Function comme alternative.

### Timeout lors de l'appel
→ L'API Sirene peut être lente. Vérifiez votre connexion internet et que l'API est accessible.

## 🔄 Migration depuis Pappers

- ✅ Fichier `src/lib/api/pappers.js` renommé en `src/lib/api/sirene.js`
- ✅ Toutes les références à Pappers ont été mises à jour
- ✅ Le code frontend utilise maintenant la fonction SQL au lieu de la Edge Function
- ✅ Aucune variable d'environnement frontend nécessaire (token géré côté serveur)

## 📝 Prochaines étapes

1. ✅ Migration SQL créée
2. ✅ Code frontend mis à jour
3. ⏳ Appliquer la migration SQL dans Supabase
4. ⏳ Configurer le secret `app.sirene_api_token`
5. ⏳ Tester la fonctionnalité avec un SIREN valide
6. ⏳ Vérifier que les données sont correctement préremplies

---

**Note** : Si l'extension `pg_net` ne fonctionne pas correctement dans votre environnement Supabase, consultez `SIRENE_EDGE_FUNCTION_SETUP.md` pour une solution alternative utilisant une Supabase Edge Function.

