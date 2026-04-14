# 🔍 Guide de Debug : URL Stripe manquante

## 🎯 Problème actuel

La réponse de l'Edge Function ne contient que `sessionId` mais pas `url`.

**Console front** :
```
[Cart] Réponse parsée create-stripe-checkout
- keys: Array(1)  ← Seulement 1 clé !
- hasUrl: false
```

## 🔍 Étapes de diagnostic

### Étape 1 : Vérifier les logs côté serveur (Edge Function)

1. Allez dans **Supabase Dashboard**
2. **Edge Functions** → `create-stripe-checkout`
3. **Logs** (onglet)
4. Filtrez par timestamp récent (quand vous avez cliqué sur "Payer")

**Recherchez ces logs** :
- `[create-stripe-checkout] Session Stripe créée:`
  - Vérifiez si `url` est présent
  - Vérifiez `hasUrl: true` ou `false`
  - Regardez `sessionKeys` pour voir toutes les clés disponibles

- `[create-stripe-checkout] ✅ Réponse envoyée:`
  - La réponse devrait être : `{ "sessionId": "...", "url": "https://checkout.stripe.com/..." }`

**Si `session.url` est `null` côté serveur** → Le problème vient de Stripe (session non créée correctement)

**Si `session.url` est présent côté serveur** → Le problème vient de la transmission entre Edge Function et front

### Étape 2 : Vérifier la réponse brute côté front

Dans la **console du navigateur**, après avoir cliqué sur "Payer maintenant par carte" :

1. Cherchez le log : `[Cart] Réponse brute Edge Function`
2. Développez l'objet
3. Regardez `dataStringified` - c'est la réponse JSON complète

**Si vous voyez** :
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```
→ L'URL est bien là, problème de parsing

**Si vous voyez** :
```json
{
  "sessionId": "cs_test_..."
}
```
→ L'URL n'est pas dans la réponse, problème côté Edge Function ou transmission

## 🛠️ Solutions selon le diagnostic

### Cas 1 : `session.url` est null dans les logs Edge Function

**Causes possibles** :
- Clé Stripe invalide (`STRIPE_SECRET_KEY` mal configurée)
- Session Stripe mal créée
- Problème avec la version de Stripe

**Solutions** :
1. Vérifiez `STRIPE_SECRET_KEY` dans **Supabase Dashboard → Edge Functions → create-stripe-checkout → Secrets**
2. Vérifiez que la clé commence par `sk_test_` (test) ou `sk_live_` (production)
3. Regardez les erreurs dans les logs Edge Function

### Cas 2 : `session.url` est présent côté serveur mais pas côté front

**Causes possibles** :
- `supabase.functions.invoke()` ne transmet pas correctement la réponse
- La réponse est tronquée

**Solution temporaire** : Utiliser `fetch()` directement au lieu de `supabase.functions.invoke()`

## 📝 Actions immédiates

1. **Testez maintenant** :
   - Cliquez sur "Payer maintenant par carte"
   - Regardez les logs dans la console du navigateur (`dataStringified`)
   - Regardez les logs dans Supabase Dashboard (Edge Functions)

2. **Partagez les résultats** :
   - Contenu de `dataStringified` dans la console
   - Contenu des logs Edge Function (`Réponse envoyée`)

Ces informations permettront d'identifier précisément où l'URL est perdue.



























