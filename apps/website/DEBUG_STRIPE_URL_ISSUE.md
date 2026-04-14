# 🔍 Debug : Problème URL Stripe manquante

## 🎯 Problème

La réponse de l'Edge Function `create-stripe-checkout` ne contient que `sessionId` mais pas `url`.

Dans la console front :
```
[Cart] Réponse parsée create-stripe-checkout
- sessionId: "cs_test_..."
- hasUrl: false
- keys: Array(1)  ← Seulement 1 clé !
```

## 🔍 À vérifier

### 1. Logs Edge Function dans Supabase Dashboard

Allez dans **Supabase Dashboard → Edge Functions → create-stripe-checkout → Logs**

Recherchez ces logs :
- `[create-stripe-checkout] Session Stripe créée:`
  - Vérifiez si `url` est présent dans `session.url`
  - Vérifiez `hasUrl: true` ou `false`
  - Vérifiez `sessionKeys` pour voir toutes les clés disponibles

- `[create-stripe-checkout] ✅ Réponse envoyée:`
  - Vérifiez que `{ sessionId: "...", url: "https://checkout.stripe.com/..." }` est bien présent

### 2. Si `session.url` est null dans les logs Edge Function

Si `session.url` est `null` ou `undefined` côté serveur, cela signifie que Stripe ne retourne pas l'URL.

**Causes possibles** :
- Session Stripe créée mais pas complètement initialisée
- Problème avec la configuration Stripe (clé secrète invalide)
- Version de Stripe.js incompatible

### 3. Si `session.url` est présent dans les logs Edge Function mais pas dans la réponse front

Si l'URL est bien présente côté serveur mais absente côté front, cela signifie que :
- La réponse est mal transmise par `supabase.functions.invoke()`
- La réponse est tronquée quelque part
- Le parsing JSON échoue silencieusement

## 🛠️ Solution temporaire : Vérifier les logs

1. **Ouvrez la console du navigateur** et regardez le log `[Cart] Réponse brute Edge Function`
   - Développez `dataStringified` pour voir la réponse complète JSON

2. **Ouvrez Supabase Dashboard → Edge Functions → create-stripe-checkout → Logs**
   - Regardez les logs récents de votre appel
   - Vérifiez si `session.url` est présent

3. **Si `session.url` est null côté serveur** :
   - Vérifiez `STRIPE_SECRET_KEY` dans les secrets Supabase
   - Essayez de recréer la session avec plus d'attente
   - Vérifiez la version de Stripe utilisée

4. **Si `session.url` est présent côté serveur mais pas côté front** :
   - Le problème vient de `supabase.functions.invoke()`
   - Essayez d'utiliser `fetch()` directement à la place

## 🚀 Test rapide

Dans la console du navigateur, après avoir cliqué sur "Payer maintenant par carte", développez :
- `[Cart] Réponse brute Edge Function` → `dataStringified`
- Voyez-vous `"url"` dans la réponse ?

Ensuite, allez dans **Supabase Dashboard → Edge Functions → create-stripe-checkout → Logs**
- Recherchez `[create-stripe-checkout] ✅ Réponse envoyée:`
- Voyez-vous `"url"` dans cette réponse ?

**Si oui côté serveur mais non côté front** → Problème de transmission
**Si non côté serveur** → Problème de création de session Stripe



























