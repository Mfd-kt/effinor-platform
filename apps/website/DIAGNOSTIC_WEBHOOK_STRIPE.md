# 🔍 Diagnostic : Webhook Stripe ne met pas à jour le statut

## 🎯 Problème

Le paiement Stripe fonctionne, mais le statut reste "En attente" dans le dashboard. Le webhook ne met pas à jour `paiement_statut` à `'payee'`.

## 🔍 Étapes de diagnostic

### 1. Vérifier que le webhook est configuré dans Stripe Dashboard

1. Aller sur [Dashboard Stripe](https://dashboard.stripe.com/)
2. **Developers** → **Webhooks**
3. Vérifier qu'un webhook existe avec l'URL :
   ```
   https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/stripe-webhook
   ```
4. Vérifier que les événements suivants sont activés :
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

### 2. Vérifier le secret du webhook dans Supabase

1. Dashboard Supabase → **Edge Functions** → **Secrets**
2. Vérifier que `STRIPE_WEBHOOK_SECRET` existe et correspond au secret du webhook dans Stripe
3. Le secret doit commencer par `whsec_...`

### 3. Vérifier les logs de l'Edge Function

1. Dashboard Supabase → **Edge Functions** → **stripe-webhook** → **Logs**
2. Après un paiement test, chercher dans les logs :
   - `📨 Webhook reçu: checkout.session.completed`
   - `✅ Checkout session completed: cs_test_...`
   - `✅ Commande mise à jour: <commande_id> → payee`

### 4. Vérifier les événements Stripe

1. Dans Stripe Dashboard → **Developers** → **Webhooks** → [Votre endpoint]
2. Onglet **Events**
3. Vérifier qu'un événement `checkout.session.completed` a été envoyé après votre paiement test
4. Cliquer sur l'événement pour voir :
   - **Status** : doit être `200 OK` (ou `Succeeded`)
   - **Response** : doit contenir `{"received": true, ...}`

### 5. Vérifier la commande dans Supabase

```sql
SELECT 
  id,
  reference,
  stripe_session_id,
  stripe_payment_intent_id,
  paiement_statut,
  mode_suivi,
  type_commande,
  created_at,
  updated_at
FROM public.commandes
WHERE stripe_session_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Vérifier** :
- `stripe_session_id` est bien rempli
- `paiement_statut` est toujours `'en_attente'` (devrait être `'payee'` après paiement)

## 🛠️ Solutions selon le diagnostic

### Cas 1 : Webhook non configuré dans Stripe

**Symptôme** : Aucun événement dans Stripe Dashboard → Webhooks → Events

**Solution** :
1. Créer le webhook dans Stripe Dashboard
2. URL : `https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/stripe-webhook`
3. Sélectionner les 4 événements
4. Copier le Signing Secret (`whsec_...`)
5. Ajouter dans Supabase Edge Functions Secrets : `STRIPE_WEBHOOK_SECRET`

### Cas 2 : Secret incorrect

**Symptôme** : Logs montrent `❌ Erreur vérification signature webhook: Invalid signature`

**Solution** :
1. Vérifier que `STRIPE_WEBHOOK_SECRET` dans Supabase correspond exactement au secret dans Stripe
2. Pas d'espaces avant/après
3. Recréer le webhook si nécessaire

### Cas 3 : Commande non trouvée par le webhook

**Symptôme** : Logs montrent `⚠️ Commande non trouvée pour session: cs_test_...`

**Solution** :
1. Vérifier que `create-stripe-checkout` met bien à jour `stripe_session_id` dans la commande
2. Vérifier que la commande existe avec le bon `stripe_session_id`

### Cas 4 : Webhook reçu mais pas de mise à jour

**Symptôme** : Logs montrent `📨 Webhook reçu` mais pas de `✅ Commande mise à jour`

**Vérifications** :
1. Vérifier que l'événement est bien `checkout.session.completed`
2. Vérifier que la commande n'est pas déjà en statut `'payee'` (idempotence)
3. Vérifier les logs d'erreur dans l'Edge Function

## 🧪 Test manuel du webhook

### Option 1 : Via Stripe Dashboard

1. Stripe Dashboard → **Developers** → **Webhooks** → [Votre endpoint]
2. Cliquer sur **Send test webhook**
3. Sélectionner `checkout.session.completed`
4. Cliquer sur **Send test webhook**
5. Vérifier la réponse (doit être `200 OK`)

### Option 2 : Via Stripe CLI

```bash
# Écouter les événements et les rediriger vers votre webhook
stripe listen --forward-to https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/stripe-webhook

# Dans un autre terminal, déclencher un événement de test
stripe trigger checkout.session.completed
```

## 📋 Checklist de vérification

- [ ] Webhook créé dans Stripe Dashboard
- [ ] URL correcte : `https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/stripe-webhook`
- [ ] 4 événements activés dans Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` configuré dans Supabase Edge Functions Secrets
- [ ] Secret correspond au Signing Secret du webhook Stripe
- [ ] Edge Function `stripe-webhook` déployée
- [ ] Test webhook réussi (200 OK)
- [ ] Commande a bien `stripe_session_id` rempli après `create-stripe-checkout`
- [ ] Logs Edge Function montrent la réception du webhook

## 🔧 Si le problème persiste

1. **Vérifier les logs complets** dans Supabase Edge Functions → stripe-webhook → Logs
2. **Vérifier les événements Stripe** dans Stripe Dashboard → Webhooks → Events
3. **Tester avec Stripe CLI** pour voir les événements en temps réel
4. **Vérifier la commande** dans Supabase pour confirmer que `stripe_session_id` est bien rempli



























