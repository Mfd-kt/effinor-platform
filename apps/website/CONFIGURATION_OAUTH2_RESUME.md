# 🎯 Résumé : Où configurer vos credentials OAuth2

## ✅ Ce que vous devez faire

### 1. Obtenir votre Client Secret

1. Retournez sur la page OAuth2 : https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670
2. Dans le champ "Client secret", révélez/copiez la valeur (elle est masquée par des points)
3. **⚠️ IMPORTANT** : Cette valeur est sensible, gardez-la secrète

### 2. Configurer dans Supabase Dashboard

Allez dans **Supabase Dashboard** > **Settings** > **Database** > **Custom Database Secrets**

Ajoutez ces **deux secrets** :

| Secret Name | Value |
|------------|-------|
| `app.sirene_client_id` | `a0fdd13d-b330-4028-808b-e43e7bbf7c0b` |
| `app.sirene_client_secret` | `(votre_client_secret_copié)` |

### 3. Alternative : Via Supabase CLI

```bash
supabase secrets set app.sirene_client_id=a0fdd13d-b330-4028-808b-e43e7bbf7c0b
supabase secrets set app.sirene_client_secret=votre_client_secret_ici
```

## 🔄 Comment ça fonctionne maintenant

1. ✅ La fonction SQL obtient automatiquement un token OAuth2 via Client Credentials
2. ✅ Utilise ce token avec `Authorization: Bearer {token}` dans les requêtes API
3. ✅ Plus besoin de clé API directe, tout passe par OAuth2

## 📝 Fichiers mis à jour

- ✅ `migrations/20260111_create_sirene_sql_functions.sql` - Supporte maintenant OAuth2
- ✅ `SIRENE_OAUTH2_CONFIG.md` - Guide de configuration détaillé

## 🚀 Prochaines étapes

1. ✅ Configurez les deux secrets dans Supabase (Client ID + Client Secret)
2. ✅ Appliquez la migration SQL mise à jour
3. ✅ Testez depuis l'interface admin avec un SIREN valide

## ❓ Questions fréquentes

**Q: Le Client Secret est-il sécurisé ?**
→ Oui, il est stocké dans les secrets Supabase (chiffré) et n'est jamais exposé au frontend.

**Q: Le token expire-t-il ?**
→ Oui, généralement après 1 heure. La fonction SQL régénère automatiquement le token si nécessaire.

**Q: Puis-je utiliser l'ancienne méthode avec la clé API ?**
→ Non, la fonction a été mise à jour pour utiliser uniquement OAuth2 (plus sécurisé).

