# 🔧 Fix : Endpoint OAuth2 déprécié

## ⚠️ Problème identifié

L'erreur dans la console indique :
```
"Erreur lors de l'obtention du token OAuth2 (404): url deprecated, visit https://portail-api.insee.fr/"
```

L'endpoint OAuth2 `https://api.insee.fr/token` est **déprécié** et ne fonctionne plus.

## ✅ Solution : Utiliser la clé d'intégration directe

D'après la documentation OpenAPI de l'API Sirene INSEE, l'API utilise maintenant **`X-INSEE-Api-Key-Integration`** comme header, **pas OAuth2 Bearer token**.

### Changements apportés

1. ✅ Edge Function mise à jour pour utiliser directement la clé d'intégration
2. ✅ Plus besoin de OAuth2 Client Credentials
3. ✅ Utilisation du header `X-INSEE-Api-Key-Integration`

### Configuration des secrets

Allez dans **Supabase Dashboard** > **Settings** > **Functions** > **Secrets**

**Supprimez** ces secrets (plus nécessaires) :
- ❌ `SIRENE_CLIENT_ID`
- ❌ `SIRENE_CLIENT_SECRET`

**Ajoutez** ce secret :
- ✅ `SIRENE_API_KEY` = (votre clé d'intégration depuis le portail INSEE)

### Comment obtenir la clé d'intégration

1. Allez sur : https://portail-api.insee.fr/
2. Connectez-vous avec votre compte
3. Allez dans votre application : https://portail-api.insee.fr/applications/e2f31f06-81bf-47a6-b31f-0681bf87a670
4. Vérifiez que vous avez bien souscrit à l'API Sirene
5. Dans la section "Clés d'intégration" ou "API Keys", générez ou copiez votre clé d'intégration
6. Utilisez cette clé comme valeur du secret `SIRENE_API_KEY`

### Déploiement

Après avoir mis à jour le secret, redéployez l'Edge Function :

```bash
cd ~/Projects/ecps-effinor
supabase functions deploy fetch-sirene-data
```

## 📝 Résumé

- ❌ Ancien système : OAuth2 Client Credentials (déprécié)
- ✅ Nouveau système : Clé d'intégration directe (`X-INSEE-Api-Key-Integration`)
- 🔑 Secret à configurer : `SIRENE_API_KEY` (au lieu de `SIRENE_CLIENT_ID` et `SIRENE_CLIENT_SECRET`)

## 🔍 Vérification

Après avoir configuré le secret et redéployé :
1. Allez dans l'interface admin
2. Testez avec un SIREN valide (ex: `907547665`)
3. Les données devraient se remplir automatiquement

