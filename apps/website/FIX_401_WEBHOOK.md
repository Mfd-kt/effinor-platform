# 🔧 Fix 401 Unauthorized sur Stripe Webhook

## 🐛 Problème

L'erreur **401 Unauthorized** apparaît dans les logs Supabase pour les webhooks Stripe. Cela signifie que la requête est bloquée avant même d'atteindre notre code.

## 🔍 Cause

Par défaut, les **Supabase Edge Functions** nécessitent une authentification Bearer token. Stripe ne peut pas fournir ce token car il ne connaît pas nos credentials Supabase.

## ✅ Solution

Désactiver la vérification JWT pour la fonction `stripe-webhook` car :
1. Les webhooks Stripe sont authentifiés via leur propre signature
2. On vérifie déjà la signature Stripe dans le code
3. Pas besoin d'authentification Supabase supplémentaire

## 📝 Modifications effectuées

### 1. Configuration dans `supabase/config.toml`

Ajout de la configuration pour désactiver `verify_jwt` :

```toml
[functions.stripe-webhook]
enabled = true
verify_jwt = false
```

### 2. Déploiement

⚠️ **IMPORTANT** : Cette configuration doit aussi être appliquée dans le **Supabase Dashboard** en production :

1. Aller dans **Supabase Dashboard** → **Edge Functions** → **stripe-webhook**
2. Ouvrir les **Settings** de la fonction
3. Désactiver **"Verify JWT"** (ou mettre `verify_jwt = false`)
4. Cliquer sur **Save**

## 🔄 Prochaines étapes

### Pour le développement local :
```bash
# Redémarrer Supabase localement pour appliquer la config
supabase stop
supabase start
```

### Pour la production :

**Option 1 : Via Supabase Dashboard (Recommandé)**
1. Dashboard → Edge Functions → stripe-webhook
2. Settings → Désactiver "Verify JWT"
3. Save

**Option 2 : Via Supabase CLI**
```bash
# Déployer avec la nouvelle config
supabase functions deploy stripe-webhook --no-verify-jwt
```

## ✅ Vérification

Après le déploiement, tester avec un webhook Stripe :

1. **Dashboard Stripe** → **Developers** → **Webhooks**
2. Cliquer sur le webhook configuré
3. Envoyer un événement de test
4. Vérifier dans **Supabase Dashboard** → **Edge Functions** → **stripe-webhook** → **Logs**
5. Ne plus voir d'erreur **401**, mais plutôt :
   - `📨 Webhook reçu: checkout.session.completed`
   - `✅ checkout.session.completed reçu:`
   - `✅ Commande mise à jour avec succès`

## 🔐 Sécurité

✅ **C'est sécurisé** car :
- On vérifie toujours la **signature Stripe** dans le code
- Seuls les webhooks signés par Stripe sont acceptés
- Le secret webhook est stocké dans les secrets Supabase
- La fonction n'est pas accessible publiquement sans la bonne signature

## 📚 Référence

- [Supabase Edge Functions - Verify JWT](https://supabase.com/docs/guides/functions/configuring-edge-functions#verify-jwt)
- [Stripe Webhooks - Security](https://stripe.com/docs/webhooks/signatures)

