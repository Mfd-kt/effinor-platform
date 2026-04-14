# ✅ Refactoring Stripe Checkout - Terminé

## 🎯 Objectif atteint

Le flux de paiement Stripe a été simplifié :
- ✅ Utilisation directe de l'URL de checkout (plus de Stripe.js)
- ✅ Suppression complète de l'utilisation de `commandes_lignes`
- ✅ L'Edge Function retourne bien `{ sessionId, url }`

## 📝 Modifications effectuées

### 1. Edge Function `create-stripe-checkout/index.ts`

**Modifications** :
- ✅ Vérification explicite de `SITE_URL` (erreur 500 si absent)
- ✅ Commentaire ajouté : localhost est supporté
- ✅ Mise à jour de la commande avec `paiement_statut`, `mode_suivi`, `type_commande`
- ✅ Retourne toujours `{ sessionId, url }` (l'URL est vérifiée avant retour)

**Points clés** :
```typescript
// Vérifier SITE_URL
if (!SITE_URL) {
  return new Response(
    JSON.stringify({ error: 'SITE_URL n\'est pas configuré' }),
    { status: 500, ... }
  )
}

// Retourner sessionId ET url
return new Response(
  JSON.stringify({
    sessionId: session.id,
    url: session.url, // IMPORTANT: vérifié avant
  }),
  { status: 200, ... }
)
```

### 2. Page panier `Cart.jsx`

**Modifications** :
- ✅ Suppression complète du bloc `commandes_lignes` (commenté avec TODO)
- ✅ Fonction `startStripeCheckout` refactorée pour utiliser directement l'URL
- ✅ Plus de dépendance à Stripe.js (`stripe.redirectToCheckout`)
- ✅ Redirection directe via `window.location.href = checkoutUrl`

**Ancien code supprimé** :
```javascript
// ❌ Supprimé : tout le bloc commandes_lignes
// ✅ Remplacé par un TODO commenté
```

**Nouveau code** :
```javascript
async function startStripeCheckout(commandeId, toast, setIsSubmitting, setSubmitMode) {
  // Appel Edge Function
  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: { commande_id: commandeId },
  });

  const checkoutUrl = data?.url;

  // Redirection directe
  if (checkoutUrl) {
    window.location.href = checkoutUrl;
    return;
  }
  // ...
}
```

### 3. Client Stripe `stripeClient.js`

**Modifications** :
- ✅ Commentaire ajouté : fichier non utilisé pour le flux e-commerce principal
- ✅ TODO pour suppression future si plus utilisé

### 4. Flux "Être rappelé par un expert"

**Vérifié** : ✅ Inchangé
- Crée une commande avec `mode_suivi = 'rappel'`
- N'appelle pas l'Edge Function Stripe
- Redirige vers `/merci`

## ✅ Résultat final

### Flux "Payer maintenant par carte" :

1. ✅ Validation du formulaire
2. ✅ Calcul des totaux
3. ✅ **Insertion dans `public.commandes` uniquement**
4. ✅ **Plus d'insert dans `commandes_lignes`** (code commenté)
5. ✅ Appel Edge Function `create-stripe-checkout`
6. ✅ Edge Function retourne `{ sessionId, url }`
7. ✅ Redirection directe vers Stripe : `window.location.href = checkoutUrl`
8. ✅ **Plus d'erreur RLS sur `commandes_lignes`** dans la console

### Flux "Être rappelé par un expert" :

1. ✅ Crée une commande avec `mode_suivi = 'rappel'`
2. ✅ Pas d'appel Edge Function Stripe
3. ✅ Redirection vers `/merci`

## 🔍 Points à vérifier

1. **Variables d'environnement** :
   - `VITE_STRIPE_PUBLIC_KEY` : plus nécessaire pour le flux principal (mais peut rester pour autres usages)
   - `SITE_URL` dans Supabase Edge Functions secrets : doit être défini

2. **Test localhost** :
   - `SITE_URL` peut être `http://localhost:3000` en développement
   - Stripe Checkout fonctionne avec localhost

3. **Routes** :
   - `/paiement/succes` doit exister
   - `/paiement/annulee` doit exister

## 🎉 Avantages de ce refactoring

- ✅ **Plus simple** : Pas besoin de Stripe.js côté client
- ✅ **Plus fiable** : Pas de dépendance à la table `commandes_lignes`
- ✅ **Plus rapide** : Redirection directe vers Stripe
- ✅ **Moins d'erreurs** : Plus d'erreur RLS dans la console



























