# 🔍 Débogage de l'erreur Edge Function

## ⚠️ Erreur observée

"Edge Function returned a non-2xx status code"

Cela signifie que l'Edge Function a été appelée mais a renvoyé une erreur (401, 403, 500, etc.).

## 📋 Checklist de diagnostic

### 1. Vérifier les secrets OAuth2

Allez dans **Supabase Dashboard** > **Settings** > **Functions** > **Secrets**

Vérifiez que ces 2 secrets sont bien configurés :

- ✅ `SIRENE_CLIENT_ID` = `a0fdd13d-b330-4028-808b-e43e7bbf7c0b`
- ✅ `SIRENE_CLIENT_SECRET` = (votre Client Secret depuis la page OAuth2 INSEE)

⚠️ **Important** : Le Client Secret doit être la valeur exacte copiée depuis https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670

### 2. Vérifier les logs de l'Edge Function

Allez dans **Supabase Dashboard** > **Functions** > **fetch-sirene-data** > **Logs**

Vous devriez voir les erreurs détaillées, par exemple :
- "Configuration OAuth2 manquante" → Les secrets ne sont pas configurés
- "Erreur d'authentification OAuth2 (401/403)" → Les credentials sont incorrects
- "Erreur API (XXX)" → Problème avec l'API Sirene

### 3. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et regardez les erreurs détaillées.

L'erreur devrait donner plus d'informations sur le code de statut (401, 403, 500, etc.).

### 4. Tester l'Edge Function directement

Vous pouvez tester l'Edge Function directement depuis Supabase Dashboard :

1. Allez dans **Functions** > **fetch-sirene-data**
2. Cliquez sur "Invoke function"
3. Entrez dans le body : `{"siren": "907547665"}`
4. Cliquez sur "Invoke"
5. Regardez la réponse et les logs

## 🔧 Solutions courantes

### Erreur 401/403 : "Configuration OAuth2 manquante"

**Cause** : Les secrets ne sont pas configurés ou mal nommés.

**Solution** :
1. Vérifiez que les noms des secrets sont exactement :
   - `SIRENE_CLIENT_ID` (en majuscules)
   - `SIRENE_CLIENT_SECRET` (en majuscules)
2. Vérifiez que les valeurs sont correctes
3. Redéployez l'Edge Function après avoir ajouté les secrets :
   ```bash
   supabase functions deploy fetch-sirene-data
   ```

### Erreur 401 : "Erreur d'authentification OAuth2"

**Cause** : Le Client ID ou Client Secret est incorrect.

**Solution** :
1. Vérifiez que le Client ID est : `a0fdd13d-b330-4028-808b-e43e7bbf7c0b`
2. Copiez à nouveau le Client Secret depuis la page OAuth2 INSEE
3. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
4. Mettez à jour les secrets dans Supabase Dashboard

### Erreur 500 : "Erreur lors de l'obtention du token OAuth2"

**Cause** : Problème avec l'endpoint OAuth2 de l'INSEE.

**Solution** :
1. Vérifiez que votre application est bien active sur le portail INSEE
2. Vérifiez que vous avez bien souscrit à l'API Sirene
3. Vérifiez les quotas de l'API (30 requêtes/minute)

### Erreur 404 : "Entreprise non trouvée"

**Cause** : Le SIREN n'existe pas dans la base Sirene.

**Solution** :
- Utilisez un SIREN valide (ex: `907547665` pour tester)

## 🔍 Vérification étape par étape

### Étape 1: Vérifier les secrets

```bash
# Dans Supabase Dashboard > Settings > Functions > Secrets
# Vérifiez visuellement que les 2 secrets sont présents
```

### Étape 2: Tester l'Edge Function

1. Allez dans **Supabase Dashboard** > **Functions** > **fetch-sirene-data**
2. Cliquez sur "Invoke function"
3. Body : `{"siren": "907547665"}`
4. Cliquez sur "Invoke"
5. Regardez la réponse

### Étape 3: Vérifier les logs

Dans **Functions** > **fetch-sirene-data** > **Logs**, vous devriez voir :
- Les appels OAuth2
- Les appels à l'API Sirene
- Les erreurs détaillées

## 📝 Informations à partager pour le débogage

Si le problème persiste, partagez :
1. Les logs de l'Edge Function (Supabase Dashboard > Functions > fetch-sirene-data > Logs)
2. Les erreurs de la console du navigateur (F12 > Console)
3. Confirmation que les secrets sont bien configurés
4. La réponse de l'invocation test (si vous avez testé directement)

## 🎯 Test rapide

Utilisez ce SIREN pour tester : `907547665`

C'est un SIREN valide qui devrait fonctionner si tout est bien configuré.

