# 🔗 Configuration du Webhook Stripe

Ce document explique comment configurer le webhook Stripe pour mettre à jour automatiquement le statut de paiement des commandes dans Supabase.

---

## 📋 Prérequis

- Compte Stripe (mode test ou production)
- Projet Supabase configuré
- Edge Function `stripe-webhook` déployée sur Supabase

---

## 🔐 Variables d'environnement requises

### Dans Supabase Dashboard → Edge Functions → Secrets

Configurer les secrets suivants pour l'Edge Function `stripe-webhook` :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (déjà configurée pour `create-stripe-checkout`) | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | **NOUVEAU** - Secret du webhook (à récupérer après configuration dans Stripe) | `whsec_...` |
| `SUPABASE_URL` | URL de votre projet Supabase | Automatique dans Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase | Automatique dans Edge Functions |

---

## 🚀 Étapes de configuration

### 1. Déployer l'Edge Function

```bash
# Via Supabase CLI
supabase functions deploy stripe-webhook

# Ou via le Dashboard Supabase
# Edge Functions → stripe-webhook → Deploy
```

### 2. Obtenir l'URL du webhook

L'URL du webhook est au format :

```
https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

**Exemple** :
```
https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/stripe-webhook
```

Pour trouver votre `PROJECT_REF` :
- Dashboard Supabase → Settings → API → Project URL
- L'identifiant avant `.supabase.co` est votre `PROJECT_REF`

### 3. Configurer le webhook dans Stripe

#### A. Accéder aux Webhooks Stripe

1. Aller sur [Dashboard Stripe](https://dashboard.stripe.com/)
2. Naviguer vers **Developers** → **Webhooks**
3. Cliquer sur **Add endpoint**

#### B. Configurer l'endpoint

1. **Endpoint URL** : Entrer l'URL du webhook obtenue à l'étape 2
   ```
   https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
   ```

2. **Description** : `Effinor - Mise à jour statut commandes`

3. **Mode** : 
   - Sélectionner **Test mode** pour les tests
   - Ou **Live mode** pour la production

#### C. Sélectionner les événements

Sélectionner les événements suivants à écouter :

- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

**Option** : Vous pouvez aussi sélectionner **"Select all events"** pour recevoir tous les événements (la fonction ne traitera que ceux mentionnés ci-dessus).

#### D. Créer l'endpoint

1. Cliquer sur **Add endpoint**
2. Stripe va créer le webhook et générer un **Signing secret**

#### E. Récupérer le Signing Secret

1. Sur la page du webhook créé, cliquer sur **Reveal** à côté de "Signing secret"
2. Copier la valeur (commence par `whsec_...`)
3. **Important** : Ce secret est différent de votre `STRIPE_SECRET_KEY`

#### F. Ajouter le secret dans Supabase

1. Aller sur Dashboard Supabase → Edge Functions → Secrets
2. Ajouter un nouveau secret :
   - **Name** : `STRIPE_WEBHOOK_SECRET`
   - **Value** : Le secret copié (ex: `whsec_...`)
3. Cliquer sur **Save**

---

## ✅ Vérification de la configuration

### Test via Stripe CLI (recommandé pour les tests locaux)

#### Installation Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis https://stripe.com/docs/stripe-cli
```

#### Connexion à Stripe

```bash
stripe login
```

#### Tester le webhook localement (mode tunnel)

```bash
# Créer un tunnel vers votre fonction locale
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Dans un autre terminal, déclencher un événement de test
stripe trigger checkout.session.completed
```

#### Tester avec l'URL Supabase

```bash
# Écouter les événements et les rediriger vers votre webhook Supabase
stripe listen --forward-to https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook

# Dans un autre terminal, déclencher un événement de test
stripe trigger checkout.session.completed
```

### Test via Dashboard Stripe

1. Aller sur le webhook dans Stripe Dashboard
2. Cliquer sur **Send test webhook**
3. Sélectionner un événement (ex: `checkout.session.completed`)
4. Cliquer sur **Send test webhook**
5. Vérifier la réponse (devrait être `200 OK`)

### Vérifier dans Supabase

Après un événement de test, vérifier dans la table `commandes` :

```sql
SELECT 
  id,
  reference,
  stripe_session_id,
  stripe_payment_intent_id,
  paiement_statut,
  updated_at
FROM public.commandes
ORDER BY updated_at DESC
LIMIT 5;
```

Le `paiement_statut` devrait être mis à jour selon l'événement reçu.

---

## 📊 Événements gérés

| Événement Stripe | Statut mis à jour | Description |
|------------------|-------------------|-------------|
| `checkout.session.completed` | `payee` | Session de paiement terminée avec succès |
| `checkout.session.expired` | `annulee` | Session de paiement expirée |
| `payment_intent.succeeded` | `payee` | Paiement réussi |
| `payment_intent.payment_failed` | `echouee` | Échec du paiement |

### Comportement idempotent

La fonction est **idempotente** : si une commande est déjà en statut `payee`, elle ne sera pas modifiée par un événement `payment_failed` ou `expired`.

---

## 🔍 Logs et debugging

### Logs Supabase

Les logs de l'Edge Function sont disponibles dans :
- Dashboard Supabase → Edge Functions → `stripe-webhook` → Logs

### Logs Stripe

Les événements envoyés par Stripe sont visibles dans :
- Dashboard Stripe → Developers → Webhooks → [Votre endpoint] → Events

### Format des logs

La fonction loggue dans la console :
- ✅ `📨 Webhook reçu: <event_type> <event_id>`
- ✅ `✅ Checkout session completed: <session_id>`
- ✅ `✅ Commande mise à jour: <commande_id> → <statut>`
- ⚠️ `⚠️ Commande non trouvée pour session: <session_id>`
- ❌ `❌ Erreur vérification signature webhook: <error>`

---

## 🐛 Dépannage

### Erreur : "Invalid signature"

**Cause** : Le `STRIPE_WEBHOOK_SECRET` ne correspond pas au secret du webhook dans Stripe.

**Solution** :
1. Vérifier que le secret dans Supabase correspond exactement à celui dans Stripe Dashboard
2. Vérifier qu'il n'y a pas d'espaces avant/après le secret
3. Recréer le webhook dans Stripe et mettre à jour le secret si nécessaire

### Erreur : "Commande non trouvée"

**Cause** : La commande n'existe pas dans `public.commandes` avec le `stripe_session_id` correspondant.

**Solution** :
- Vérifier que la commande a bien été créée avec `stripe_session_id`
- Vérifier que `create-stripe-checkout` a bien mis à jour la commande

### Webhook reçu mais pas de mise à jour

**Vérifications** :
1. Vérifier les logs de l'Edge Function dans Supabase
2. Vérifier que l'événement est bien l'un des événements gérés
3. Vérifier que la commande n'est pas déjà en statut `payee` (comportement idempotent)

### Test en local avec Stripe CLI

Si vous testez en local, utilisez le secret fourni par Stripe CLI :

```bash
stripe listen --print-secret
```

Utilisez ce secret comme `STRIPE_WEBHOOK_SECRET` pour les tests locaux uniquement.

---

## 🔒 Sécurité

### Vérification de signature

Le webhook vérifie **obligatoirement** la signature Stripe avant de traiter un événement. Cela garantit que les événements proviennent bien de Stripe.

### Secrets

- **Ne jamais** commiter les secrets dans le code
- **Toujours** utiliser les secrets Supabase Edge Functions
- **Différencier** les secrets entre mode test et production

---

## 📝 Notes importantes

1. **Mode test vs Production** : Configurez deux webhooks distincts (un pour test, un pour production) avec des secrets différents.

2. **Délais** : Les webhooks peuvent prendre quelques secondes à quelques minutes pour être traités par Stripe.

3. **Retry** : Stripe réessaie automatiquement les webhooks en cas d'échec (erreur 500). Les webhooks avec erreur 400 (signature invalide) ne sont pas réessayés.

4. **Idempotence** : La fonction est idempotente : recevoir plusieurs fois le même événement n'aura pas d'effet de bord.

---

## 🔄 Workflow complet

1. **Client** : Remplit le panier et clique sur "Payer maintenant par carte"
2. **Front** : Appelle `create-stripe-checkout` qui crée une session Stripe
3. **Stripe** : Client paie via Stripe Checkout
4. **Stripe** : Envoie `checkout.session.completed` → Webhook
5. **Webhook** : Met à jour `paiement_statut = 'payee'` dans Supabase
6. **Admin** : Voit le statut mis à jour automatiquement dans le dashboard

---

## ✅ Checklist finale

- [ ] Edge Function `stripe-webhook` déployée
- [ ] Secret `STRIPE_WEBHOOK_SECRET` configuré dans Supabase
- [ ] Webhook créé dans Stripe Dashboard
- [ ] URL du webhook configurée dans Stripe
- [ ] 4 événements sélectionnés dans Stripe
- [ ] Test réussi avec Stripe CLI ou Dashboard
- [ ] Vérification dans Supabase : commande mise à jour correctement

---

Pour toute question ou problème, consulter les logs de l'Edge Function dans Supabase Dashboard.



























