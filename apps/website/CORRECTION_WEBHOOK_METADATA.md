# ✅ Correction Webhook Stripe - Utilisation de metadata.commande_id

## 🎯 Problème résolu

Le webhook Stripe utilise maintenant directement `metadata.commande_id` au lieu de rechercher la commande par `stripe_session_id`. C'est plus fiable et plus simple.

## 📝 Modifications effectuées

### 1. Edge Function `stripe-webhook/index.ts`

**Changements principaux** :

#### `checkout.session.completed`
- ❌ **Avant** : Recherche par `stripe_session_id` via `findCommandeBySessionId()`
- ✅ **Après** : Utilisation directe de `session.metadata.commande_id`
- Logs améliorés avec toutes les infos de session

#### `payment_intent.succeeded`
- ❌ **Avant** : Recherche complexe avec plusieurs fallbacks
- ✅ **Après** : Utilisation directe de `paymentIntent.metadata.commande_id` en priorité
- Fallback sur recherche DB seulement si metadata absent

#### `payment_intent.payment_failed`
- ✅ Même logique : `metadata.commande_id` en priorité, fallback si absent

#### `checkout.session.expired`
- ✅ Utilisation directe de `session.metadata.commande_id`

### 2. Logs améliorés

Chaque événement loggue maintenant :
- Les metadata complètes
- Le `commande_id` trouvé (ou null)
- Les erreurs claires si `commande_id` est manquant

### 3. Vérification Edge Function `create-stripe-checkout`

✅ Confirmé : La fonction ajoute bien `commande_id` dans les metadata :
```typescript
metadata: {
  commande_id: commande_id,
}
```

## 🔄 Flux complet

1. **Client** : Remplit le panier et clique sur "Payer maintenant par carte"
2. **Front** : Appelle `create-stripe-checkout` qui :
   - Crée une session Stripe
   - Ajoute `metadata: { commande_id: ... }` à la session
   - Retourne `{ sessionId, url }`
3. **Client** : Redirigé vers Stripe Checkout et paie
4. **Stripe** : Envoie `checkout.session.completed` → Webhook avec `metadata.commande_id`
5. **Webhook** : 
   - Lit `metadata.commande_id` directement
   - Met à jour `paiement_statut = 'payee'` dans Supabase
6. **Admin** : Voit le statut mis à jour automatiquement

## ✅ Avantages

- ✅ **Plus simple** : Pas besoin de chercher par `stripe_session_id`
- ✅ **Plus fiable** : `metadata.commande_id` est toujours présent dans les événements Stripe
- ✅ **Plus rapide** : Moins de requêtes DB
- ✅ **Logs clairs** : Facile de voir si `commande_id` est manquant

## 🔍 Tests à faire

1. **Faire un nouveau paiement test** :
   - Ajouter des produits au panier
   - Remplir le formulaire
   - Cliquer sur "Payer maintenant par carte"
   - Payer avec carte test Stripe (4242 4242 4242 4242)

2. **Vérifier dans Supabase Dashboard → Edge Functions → stripe-webhook → Logs** :
   - Chercher `✅ checkout.session.completed reçu:`
   - Vérifier que `metadata: { commande_id: "..." }` est présent
   - Vérifier `✅ Commande mise à jour avec succès`

3. **Vérifier dans la base de données** :
   ```sql
   SELECT 
     id,
     reference,
     paiement_statut,
     stripe_session_id,
     stripe_payment_intent_id,
     updated_at
   FROM public.commandes
   WHERE reference = 'CMD-20251126-4384'  -- Remplacer par votre référence
   ORDER BY updated_at DESC
   LIMIT 1;
   ```
   - `paiement_statut` doit être `'payee'` (pas `'en_attente'`)

## 🐛 Si le statut ne se met toujours pas à jour

Vérifier dans les logs :
1. Le webhook est-il reçu ? (chercher `📨 Webhook reçu:`)
2. `metadata.commande_id` est-il présent ? (chercher `metadata: { commande_id: ... }`)
3. Y a-t-il une erreur ? (chercher `❌` dans les logs)

Si `metadata.commande_id` est null, vérifier que `create-stripe-checkout` ajoute bien les metadata.



























