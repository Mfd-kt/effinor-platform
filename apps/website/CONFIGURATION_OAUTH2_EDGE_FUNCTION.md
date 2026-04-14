# ✅ Configuration OAuth2 avec Edge Function

## 🎯 Solution : Utiliser Edge Function Secrets

Comme vous avez accès aux **Edge Function Secrets** mais pas aux Database Secrets, nous allons utiliser une **Edge Function Supabase** qui utilise OAuth2 Client Credentials.

## 📋 Étape 1: Configurer les Secrets dans Supabase

Allez dans **Settings** > **Functions** > **Secrets** (ou la page que vous voyez)

Ajoutez ces **2 secrets** :

| Secret Name | Value |
|------------|-------|
| `SIRENE_CLIENT_ID` | `a0fdd13d-b330-4028-808b-e43e7bbf7c0b` |
| `SIRENE_CLIENT_SECRET` | `(copiez la valeur depuis votre page OAuth2)` |

## 🔧 Étape 2: Mise à jour de l'Edge Function

L'Edge Function existante (`supabase/functions/fetch-sirene-data/index.ts`) sera mise à jour pour :
1. Lire `SIRENE_CLIENT_ID` et `SIRENE_CLIENT_SECRET` depuis les Edge Function Secrets
2. Obtenir un token OAuth2 via Client Credentials
3. Utiliser ce token pour appeler l'API Sirene

## ✅ Avantages de cette approche

- ✅ Utilise les secrets disponibles (Edge Function Secrets)
- ✅ Plus simple que les fonctions SQL
- ✅ Pas de problème CORS
- ✅ Credentials sécurisés (jamais exposés au client)

