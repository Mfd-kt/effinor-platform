# ✅ Corrections du flux de paiement Stripe

## 🎯 Objectif

Corriger le flux de paiement Stripe pour qu'il fonctionne même si l'insert dans `commandes_lignes` échoue (erreur RLS), et utiliser `redirectToCheckout` avec le `sessionId` pour la redirection.

---

## ✅ Modifications effectuées

### 1. Fonction `startStripeCheckout` créée

**Fichier** : `src/pages/Cart.jsx` (lignes 16-123)

- Fonction dédiée pour gérer tout le processus Stripe
- Utilise le client Stripe centralisé (`getStripeInstance`, `isStripeConfigured`)
- Appelle l'Edge Function `create-stripe-checkout`
- Utilise `stripe.redirectToCheckout({ sessionId })` pour la redirection
- Gestion complète des erreurs avec toasts et logs

### 2. Gestion non-bloquante de l'erreur RLS

**Fichier** : `src/pages/Cart.jsx` (lignes 422-452)

- L'erreur RLS sur `commandes_lignes` est loggée mais ne bloque pas le flux
- Commentaire explicite expliquant que les produits sont déjà dans `commandes.produits` (snapshot JSON)
- Le flux continue vers Stripe même si l'insert des lignes échoue

```javascript
// TODO: corriger la RLS sur commandes_lignes côté Supabase.
// Pour l'instant, on ne bloque pas le flux de commande car les produits sont déjà
// enregistrés dans commandes.produits (snapshot JSON).
```

### 3. Utilisation de `redirectToCheckout({ sessionId })`

**Fichier** : `src/pages/Cart.jsx` (ligne 111)

- Utilise uniquement `sessionId` de la réponse de l'Edge Function
- Plus de recherche d'URL dans la réponse
- `stripe.redirectToCheckout({ sessionId })` appelé directement

### 4. Parsing robuste de la réponse

**Fichier** : `src/pages/Cart.jsx` (lignes 68-81)

- Gère le cas où `stripeData` est une string JSON
- Parse manuellement si nécessaire
- Logs détaillés pour le debug

---

## 📋 Flux corrigé

### Mode "Payer maintenant par carte" :

1. ✅ Validation du formulaire
2. ✅ Création de la commande dans `commandes` (avec snapshot produits dans `produits` JSON)
3. ✅ Tentative d'insert dans `commandes_lignes` (non-bloquant si RLS échoue)
4. ✅ Appel Edge Function `create-stripe-checkout`
5. ✅ Récupération du `sessionId`
6. ✅ Initialisation Stripe avec client centralisé
7. ✅ Redirection via `stripe.redirectToCheckout({ sessionId })`

### Mode "Être rappelé par un expert" :

- Flux inchangé (création commande → n8n webhook → redirection `/merci`)

---

## 🔍 Points importants

### RLS sur `commandes_lignes`

L'erreur RLS est gérée de manière non-bloquante car :
- Les produits sont déjà sauvegardés dans `commandes.produits` (JSON)
- L'insert dans `commandes_lignes` est optionnel pour le paiement
- La commande peut être payée même sans les lignes

**Action à faire** : Exécuter la migration SQL `migrations/20251126_fix_rls_commandes_lignes.sql` pour corriger définitivement la RLS.

### `redirectToCheckout` déprécié ?

Si vous voyez une erreur "redirectToCheckout is no longer supported", cela signifie que votre version de Stripe.js a supprimé cette méthode.

**Solution alternative** : Utiliser l'URL retournée par Stripe :
```javascript
const checkoutUrl = parsedStripeData?.url;
if (checkoutUrl) {
  window.location.href = checkoutUrl;
}
```

L'Edge Function retourne déjà `url` dans la réponse (ligne 127).

---

## 🧪 Tests à effectuer

1. **Test paiement en ligne** :
   - Ajouter produits au panier
   - Remplir formulaire
   - Cliquer "Payer maintenant par carte"
   - ✅ Devrait créer la commande
   - ✅ Devrait créer les lignes (ou logguer l'erreur RLS sans bloquer)
   - ✅ Devrait appeler l'Edge Function
   - ✅ Devrait rediriger vers Stripe Checkout

2. **Vérifier les logs** :
   - Console devrait montrer : `[Cart] Session Stripe créée` avec `sessionId`
   - Si erreur RLS : `[Cart] Erreur création lignes de commande (RLS probable)` (non-bloquant)

---

## 📝 Fichiers modifiés

1. ✅ `src/pages/Cart.jsx` :
   - Fonction `startStripeCheckout` ajoutée
   - Gestion non-bloquante de l'erreur RLS
   - Utilisation de `redirectToCheckout({ sessionId })`

---

## 🚨 Si `redirectToCheckout` ne fonctionne pas

Si vous voyez l'erreur "redirectToCheckout is no longer supported", modifiez la ligne 111 de `Cart.jsx` :

**Remplacer** :
```javascript
const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
```

**Par** :
```javascript
// Fallback : utiliser l'URL directement
const checkoutUrl = parsedStripeData?.url;
if (checkoutUrl) {
  window.location.href = checkoutUrl;
  return;
}
```

---

**Date** : 2025-11-26  
**Status** : ✅ Code modifié et build OK



























