# ✅ Configuration Finale OAuth2 pour API Sirene

## 🎯 Solution : Edge Function avec OAuth2 Client Credentials

Comme vous avez accès aux **Edge Function Secrets** (mais pas aux Database Secrets), nous utilisons une **Supabase Edge Function** qui :
1. ✅ Lit `SIRENE_CLIENT_ID` et `SIRENE_CLIENT_SECRET` depuis les Edge Function Secrets
2. ✅ Obtient un token OAuth2 via Client Credentials
3. ✅ Appelle l'API Sirene INSEE avec ce token
4. ✅ Retourne les données au frontend

## 📋 Étape 1: Configurer les Secrets dans Supabase

### Dans le Dashboard Supabase :

1. Allez dans **Settings** > **Functions** > **Secrets** (ou la page "Edge Function Secrets" que vous voyez)
2. Cliquez sur **"Add another"** si nécessaire pour ajouter plusieurs secrets
3. Ajoutez ces **2 secrets** :

| Name | Value |
|------|-------|
| `SIRENE_CLIENT_ID` | `a0fdd13d-b330-4028-808b-e43e7bbf7c0b` |
| `SIRENE_CLIENT_SECRET` | `(copiez la valeur depuis votre page OAuth2 INSEE)` |

4. Cliquez sur **"Save"** en haut à droite

### ⚠️ Important : Obtenir le Client Secret

1. Retournez sur la page OAuth2 INSEE : https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670
2. Dans le champ "Client secret", révélez/copiez la valeur (elle est masquée par des points)
3. Utilisez cette valeur comme `SIRENE_CLIENT_SECRET`

## 🚀 Étape 2: Déployer l'Edge Function

### Prérequis

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref erjgptxkctrfszrzhoxa
```

### Déployer la fonction

```bash
# Depuis la racine du projet
supabase functions deploy fetch-sirene-data
```

## ✅ Étape 3: Tester

1. Allez dans l'interface admin sur votre site
2. Ouvrez un lead existant ou créez-en un nouveau
3. Dans la section "Société", entrez un SIREN (9 chiffres)
4. Cliquez sur le bouton **"Récupérer"** à côté du champ SIREN
5. Les données de l'entreprise devraient être automatiquement remplies

## 📝 Résumé des changements

### Fichiers modifiés :

1. ✅ `supabase/functions/fetch-sirene-data/index.ts` - Mise à jour pour utiliser OAuth2 Client Credentials
2. ✅ `src/lib/api/sirene.js` - Appel de l'Edge Function au lieu de la fonction SQL RPC

### Fichiers non utilisés (peuvent être ignorés) :

- ❌ `migrations/20260111_create_sirene_sql_functions.sql` - N'est plus nécessaire avec l'Edge Function

## 🔍 Architecture

```
Frontend (React)
    ↓ supabase.functions.invoke('fetch-sirene-data')
Edge Function (Deno)
    ↓ lit SIRENE_CLIENT_ID et SIRENE_CLIENT_SECRET
OAuth2 Token Endpoint (https://api.insee.fr/token)
    ↓ retourne access_token
API Sirene (https://api.insee.fr/api-sirene/3.11)
    ↓ retourne données entreprise
Edge Function
    ↓ retourne données formatées
Frontend
    ↓ mappe les données vers les champs du lead
Formulaire rempli ✅
```

## ✅ Avantages de cette solution

- ✅ Utilise les Edge Function Secrets (déjà disponibles dans votre dashboard)
- ✅ Plus simple que les fonctions SQL complexes
- ✅ Pas de problème CORS (appels côté serveur)
- ✅ Credentials sécurisés (jamais exposés au client)
- ✅ Cache du token OAuth2 (optimisé pour les performances)
- ✅ Facile à débugger et maintenir

## 🆘 Dépannage

### Erreur "Configuration OAuth2 manquante"
→ Vérifiez que les 2 secrets sont bien configurés dans **Edge Function Secrets** :
- `SIRENE_CLIENT_ID`
- `SIRENE_CLIENT_SECRET`

### Erreur "401 Unauthorized"
→ Vérifiez que le Client ID et Client Secret sont corrects (copiés depuis la page OAuth2 INSEE)

### Erreur "Edge Function not found"
→ Déployez l'Edge Function avec : `supabase functions deploy fetch-sirene-data`

### Le bouton "Récupérer" ne fonctionne pas
→ Vérifiez la console du navigateur pour les erreurs
→ Vérifiez que l'Edge Function est bien déployée et accessible

## 📚 Documentation

- **API Sirene INSEE** : https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content
- **Portail API INSEE** : https://portail-api.insee.fr/
- **Page OAuth2 de votre application** : https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670

