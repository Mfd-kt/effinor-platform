# ✅ Configuration OAuth2 Correcte pour API Sirene

## 🔍 Problème identifié

Vous avez accès à **Edge Function Secrets** dans Supabase, mais pas à "Custom Database Secrets".

Les **Edge Function Secrets** sont uniquement accessibles depuis les **Edge Functions** (JavaScript/TypeScript), **pas depuis les fonctions SQL PostgreSQL**.

## ✅ Solution : Utiliser une Edge Function

Nous allons utiliser une **Edge Function Supabase** qui :
1. ✅ Accède aux Edge Function Secrets (Client ID + Client Secret)
2. ✅ Obtient un token OAuth2 via Client Credentials
3. ✅ Appelle l'API Sirene INSEE avec ce token
4. ✅ Retourne les données au frontend

## 📋 Configuration dans Supabase Dashboard

### Étape 1: Configurer les Edge Function Secrets

1. Allez dans **Settings** > **Functions** > **Secrets** (ou **Edge Function Secrets** dans votre dashboard)
2. Ajoutez ces **2 secrets** :

| Secret Name | Value |
|------------|-------|
| `SIRENE_CLIENT_ID` | `a0fdd13d-b330-4028-808b-e43e7bbf7c0b` |
| `SIRENE_CLIENT_SECRET` | `(votre_client_secret_copié_depuis_la_page_oauth2)` |

### Étape 2: Déployer l'Edge Function

Une Edge Function existe déjà dans `supabase/functions/fetch-sirene-data/`. Elle sera mise à jour pour utiliser OAuth2.

### Étape 3: Appeler l'Edge Function depuis le frontend

Le frontend appellera l'Edge Function au lieu de la fonction SQL RPC.

## 🔄 Architecture

```
Frontend (React)
    ↓
Edge Function (Deno)
    ↓ (lit SIRENE_CLIENT_ID et SIRENE_CLIENT_SECRET)
OAuth2 Token Endpoint (https://api.insee.fr/token)
    ↓ (retourne access_token)
API Sirene (https://api.insee.fr/api-sirene/3.11)
    ↓ (retourne données)
Edge Function
    ↓ (retourne données formatées)
Frontend
```

## 📝 Fichiers à modifier

1. ✅ `supabase/functions/fetch-sirene-data/index.ts` - Mise à jour pour OAuth2
2. ✅ `src/lib/api/sirene.js` - Appeler l'Edge Function au lieu de RPC SQL
3. ❌ `migrations/20260111_create_sirene_sql_functions.sql` - **N'EST PLUS NÉCESSAIRE**

## 🚀 Prochaines étapes

1. ✅ Configurez les 2 secrets dans **Edge Function Secrets**
2. ✅ Je vais mettre à jour l'Edge Function pour utiliser OAuth2
3. ✅ Je vais mettre à jour le frontend pour appeler l'Edge Function
4. ✅ Déployez l'Edge Function avec `supabase functions deploy fetch-sirene-data`
5. ✅ Testez depuis l'interface admin

## ❓ Pourquoi cette solution est meilleure ?

- ✅ Utilise les Edge Function Secrets (déjà disponibles)
- ✅ Plus simple (pas besoin de fonctions SQL complexes)
- ✅ Pas de problème CORS (appels côté serveur)
- ✅ Plus sécurisé (credentials jamais exposés au client)
- ✅ Facile à débugger et maintenir

