# ✅ Étapes Finales - Intégration API Sirene OAuth2

## ✅ Ce qui est fait

1. ✅ Edge Function mise à jour pour utiliser OAuth2 Client Credentials
2. ✅ Frontend mis à jour pour appeler l'Edge Function
3. ✅ Edge Function déployée sur Supabase

## 📋 Prochaines étapes

### Étape 1: Configurer les Secrets OAuth2 (SI PAS ENCORE FAIT)

Allez dans **Supabase Dashboard** > **Settings** > **Functions** > **Secrets**

Ajoutez ces **2 secrets** :

| Secret Name | Value |
|------------|-------|
| `SIRENE_CLIENT_ID` | `a0fdd13d-b330-4028-808b-e43e7bbf7c0b` |
| `SIRENE_CLIENT_SECRET` | `(copiez depuis votre page OAuth2 INSEE)` |

⚠️ **Important** : Pour obtenir le Client Secret :
1. Allez sur : https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670
2. Dans le champ "Client secret", révélez/copiez la valeur
3. Utilisez cette valeur comme `SIRENE_CLIENT_SECRET`

### Étape 2: Tester la fonctionnalité

1. **Allez sur votre site** (local ou production)
2. **Connectez-vous** à l'interface admin
3. **Ouvrez un lead existant** ou créez-en un nouveau
4. Dans la section **"Société"**, trouvez le champ **SIREN**
5. **Entrez un SIREN valide** (9 chiffres, ex: `907547665`)
6. **Cliquez sur le bouton "Récupérer"** à côté du champ SIREN
7. Les données de l'entreprise devraient être **automatiquement remplies** :
   - Nom de la société
   - SIRET (si disponible)
   - Adresse du siège
   - Code postal
   - Ville

### Étape 3: Vérifier en cas d'erreur

#### Si vous voyez "Configuration OAuth2 manquante"
→ Vérifiez que les 2 secrets sont bien configurés dans **Edge Function Secrets**

#### Si vous voyez "401 Unauthorized"
→ Vérifiez que le Client ID et Client Secret sont corrects (copiés depuis la page OAuth2 INSEE)

#### Si vous voyez "Edge Function not found"
→ Vérifiez que l'Edge Function est bien déployée dans votre Supabase Dashboard > Functions

#### Si le bouton ne fait rien
→ Ouvrez la console du navigateur (F12) et vérifiez les erreurs
→ Vérifiez que vous êtes bien connecté en tant qu'admin

## 🔍 Vérification rapide

### Dans Supabase Dashboard :

1. **Functions** > **fetch-sirene-data**
   - ✅ La fonction doit être listée et déployée
   - ✅ Statut : Active

2. **Settings** > **Functions** > **Secrets**
   - ✅ `SIRENE_CLIENT_ID` doit être présent
   - ✅ `SIRENE_CLIENT_SECRET` doit être présent

### Dans le code frontend :

1. Le fichier `src/lib/api/sirene.js` appelle maintenant :
   ```javascript
   supabase.functions.invoke('fetch-sirene-data', { body: { siren } })
   ```
   Au lieu de :
   ```javascript
   supabase.rpc('get_sirene_data_for_lead', { p_siren: siren })
   ```

## ✅ Checklist finale

- [ ] Edge Function déployée ✅
- [ ] Secret `SIRENE_CLIENT_ID` configuré
- [ ] Secret `SIRENE_CLIENT_SECRET` configuré
- [ ] Testé avec un SIREN valide
- [ ] Les données se remplissent automatiquement

## 🎉 Félicitations !

Une fois toutes les étapes complétées, vous pourrez :
- ✅ Récupérer automatiquement les données d'entreprise depuis l'API Sirene INSEE
- ✅ Pré-remplir les formulaires de leads avec les informations officielles
- ✅ Gagner du temps dans la saisie manuelle des données
- ✅ Utiliser des données à jour et fiables (API officielle INSEE)

## 📚 Documentation

- **Guide complet** : `CONFIGURATION_FINALE_OAUTH2.md`
- **Guide de déploiement** : `DEPLOY_EDGE_FUNCTION.md`
- **API Sirene INSEE** : https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content

