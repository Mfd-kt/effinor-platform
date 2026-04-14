# ✅ Récapitulatif des corrections du flux Stripe

## 🎯 Objectif

Corriger définitivement le flux de paiement Stripe en :
1. Supprimant l'usage de `stripe.redirectToCheckout` (déprécié)
2. Utilisant une redirection classique vers l'URL Stripe
3. Rendant l'erreur RLS sur `commandes_lignes` non-bloquante
4. Gardant un code propre, bien loggué, avec messages clairs en français

---

## ✅ Modifications effectuées

### 1. Edge Function `create-stripe-checkout`

**Fichier** : `supabase/functions/create-stripe-checkout/index.ts`

- ✅ Vérifie que `STRIPE_SECRET_KEY` est configuré
- ✅ Reçoit `{ commande_id }` dans le body
- ✅ Charge la commande depuis Supabase avec `service_role`
- ✅ Crée une session Stripe Checkout avec :
  - `mode: 'payment'`
  - `success_url` et `cancel_url` avec `commande_id` dans les query params
  - `customer_email` depuis la commande
  - `line_items` basés sur `total_ttc` de la commande
  - `metadata` avec `commande_id` et `reference`
- ✅ Met à jour la commande avec `stripe_session_id` et `mode_suivi: 'paiement_en_ligne'`
- ✅ **Retourne** `{ sessionId, url }` où `url` est l'URL complète de checkout Stripe

**Points importants** :
- Les URLs de redirection incluent `commande_id` pour les pages de succès/annulation
- La réponse inclut toujours `url` pour une redirection directe côté front

### 2. Page panier `Cart.jsx`

**Fichier** : `src/pages/Cart.jsx`

#### a) Fonction `startStripeCheckout` simplifiée (lignes 15-85)

- ✅ Supprime toute dépendance à Stripe.js (`getStripeInstance`, `isStripeConfigured`)
- ✅ Appelle l'Edge Function via `supabase.functions.invoke`
- ✅ Récupère l'URL de checkout depuis `stripeData.url`
- ✅ Utilise **directement** `window.location.href = checkoutUrl` pour la redirection
- ✅ Gestion complète des erreurs avec toasts en français

**Avant** (avec Stripe.js) :
```javascript
const stripe = await getStripeInstance();
const { error } = await stripe.redirectToCheckout({ sessionId });
```

**Après** (redirection directe) :
```javascript
const checkoutUrl = stripeData.url;
window.location.href = checkoutUrl;
```

#### b) Gestion non-bloquante de l'erreur RLS (lignes 443-491)

- ✅ L'insert dans `commandes_lignes` est dans un `try/catch`
- ✅ En cas d'erreur RLS (403), on loggue un `logger.warn` mais **NE PAS throw**
- ✅ Commentaire clair expliquant que les produits sont déjà dans `commandes.produits` (snapshot JSON)
- ✅ Le flux continue vers Stripe même si l'insert des lignes échoue

**Code** :
```javascript
if (linesError) {
  logger.warn('[Cart] Erreur RLS probable sur commandes_lignes', { ... });
  // NE PAS throw : on continue le flux même si RLS bloque
  // Les produits sont déjà en snapshot JSON dans commandes.produits
}
```

#### c) Gestion des erreurs de création de commande (lignes 431-441)

- ✅ Avant : `if (orderError) throw orderError;` (bloquant)
- ✅ Après : gestion propre avec toast et retour anticipé

#### d) Simplification de l'appel à `startStripeCheckout` (lignes 504-524)

- ✅ Suppression des paramètres inutiles (`totalTTC`, `customerEmail`, `lineItems`)
- ✅ Appel simplifié : `await startStripeCheckout(orderId, toast, setIsSubmitting, setSubmitMode);`

### 3. Client Stripe `stripeClient.js`

**Fichier** : `src/lib/stripeClient.js`

- ✅ **Conservé** pour l'instant (peut être utilisé ailleurs)
- ✅ **Plus utilisé** dans `Cart.jsx` (on utilise directement l'URL)
- ✅ Peut être supprimé plus tard si non utilisé ailleurs

---

## 📋 Flux corrigé

### Mode "Payer maintenant par carte" :

1. ✅ Validation du formulaire
2. ✅ Création de la commande dans `commandes` (avec snapshot produits dans `produits` JSON)
3. ✅ Tentative d'insert dans `commandes_lignes` (**non-bloquant** si RLS échoue)
4. ✅ Appel Edge Function `create-stripe-checkout` avec `commande_id`
5. ✅ Récupération de `{ sessionId, url }` dans la réponse
6. ✅ **Redirection directe** via `window.location.href = url` (plus de `redirectToCheckout`)
7. ✅ Redirection vers Stripe Checkout

### Mode "Être rappelé par un expert" :

- ✅ Flux inchangé (création commande → n8n webhook → redirection `/merci`)

---

## 🔍 Points importants

### RLS sur `commandes_lignes`

✅ **Erreur non-bloquante** :
- Les produits sont déjà sauvegardés dans `commandes.produits` (JSON)
- L'insert dans `commandes_lignes` est optionnel pour le paiement
- La commande peut être payée même sans les lignes

**Action à faire** : Exécuter la migration SQL `migrations/20251126_fix_rls_commandes_lignes.sql` pour corriger définitivement la RLS.

### Plus de `redirectToCheckout`

✅ **Redirection directe** :
- Plus besoin de Stripe.js côté front pour Checkout
- Utilisation directe de `session.url` retourné par l'Edge Function
- Plus simple, plus fiable, plus rapide

### Messages d'erreur en français

✅ **Toasts clairs** :
- "Erreur de paiement : impossible de créer la session Stripe"
- "Erreur de paiement : URL de redirection introuvable"
- "Erreur inattendue lors du paiement. Merci de réessayer ou de nous contacter."

---

## 🧪 Tests à effectuer

1. **Test paiement en ligne** :
   - Ajouter produits au panier
   - Remplir formulaire
   - Cliquer "Payer maintenant par carte"
   - ✅ Devrait créer la commande dans `commandes`
   - ✅ Devrait tenter de créer les lignes (warning console si RLS bloque, mais non-bloquant)
   - ✅ Devrait appeler l'Edge Function
   - ✅ Devrait recevoir `{ sessionId, url }`
   - ✅ Devrait rediriger vers Stripe Checkout via `window.location.href`

2. **Vérifier les logs** :
   - Console devrait montrer : `[Cart] Réponse create-stripe-checkout` avec `hasUrl: true`
   - Si erreur RLS : `[Cart] Erreur RLS probable sur commandes_lignes` (warning, non-bloquant)

---

## 📝 Fichiers modifiés

1. ✅ `supabase/functions/create-stripe-checkout/index.ts` :
   - Retourne toujours `{ sessionId, url }`

2. ✅ `src/pages/Cart.jsx` :
   - Fonction `startStripeCheckout` simplifiée (plus de Stripe.js)
   - Gestion non-bloquante de l'erreur RLS
   - Redirection directe via `window.location.href`

3. ⚠️ `src/lib/stripeClient.js` :
   - Conservé mais plus utilisé dans `Cart.jsx`

---

**Date** : 2025-11-26  
**Status** : ✅ Code modifié et build OK



























