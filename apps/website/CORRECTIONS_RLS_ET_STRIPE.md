# 🔧 Corrections Urgentes - RLS et Stripe

## ❌ Problème 1 : RLS bloque l'insertion des lignes de commande

**Erreur** : `403 Forbidden - new row violates row-level security policy for table "commandes_lignes"`

**Cause** : Les politiques RLS ne permettent pas aux utilisateurs anonymes d'insérer des lignes de commande.

**Solution** : Exécuter la migration SQL `migrations/20251126_fix_rls_commandes_lignes.sql`

Cette migration crée des politiques RLS qui :
- Permettent aux utilisateurs anonymes d'insérer des lignes de commande si la commande existe et a été créée récemment (< 5 minutes)
- Permettent aux admins authentifiés d'insérer/modifier toutes les lignes
- Permettent la lecture des lignes aux admins

**Action immédiate** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier/coller le contenu de `migrations/20251126_fix_rls_commandes_lignes.sql`
3. Exécuter la migration

---

## ❌ Problème 2 : `redirectToCheckout()` dépréciée dans Stripe.js

**Erreur** : `IntegrationError: stripe.redirectToCheckout is no longer supported in this version of Stripe.js`

**Cause** : Stripe.js v2+ a supprimé la méthode `redirectToCheckout()`. Il faut utiliser l'URL de checkout directement.

**Solution appliquée** :
1. **Edge Function** (`supabase/functions/create-stripe-checkout/index.ts`) :
   - Modifiée pour retourner `url` en plus de `sessionId`
   - L'URL est fournie directement par Stripe lors de la création de la session

2. **Front-end** (`src/pages/Cart.jsx`) :
   - Suppression de l'appel à `stripe.redirectToCheckout()`
   - Utilisation directe de `window.location.href = checkoutUrl`
   - Ajout d'un fallback si l'URL n'est pas retournée

**Action immédiate** :
- ✅ Code déjà modifié
- Redémarrer le serveur : `npm run dev`
- Redéployer l'Edge Function si nécessaire : `supabase functions deploy create-stripe-checkout`

---

## 📝 Checklist de correction complète

### 1. Exécuter la migration RLS

```sql
-- migrations/20251126_fix_rls_commandes_lignes.sql
```

Cette migration :
- Active RLS sur `commandes_lignes`
- Crée une politique pour permettre l'insertion anonyme (si commande récente)
- Crée une politique pour les admins

### 2. Vérifier l'Edge Function Stripe

Vérifier que `supabase/functions/create-stripe-checkout/index.ts` retourne bien :
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

### 4. Redéployer l'Edge Function (si nécessaire)

```bash
supabase functions deploy create-stripe-checkout
```

---

## 🔍 Tests après correction

1. **Test insertion lignes de commande** :
   - Ajouter des produits au panier
   - Remplir le formulaire
   - Soumettre
   - Vérifier dans la console : `[Cart] Order lines created successfully`
   - Vérifier dans Supabase : les lignes apparaissent dans `commandes_lignes`

2. **Test redirection Stripe** :
   - Cliquer "Payer maintenant par carte"
   - Vérifier dans la console : `[Stripe] Redirecting to Checkout URL: https://checkout.stripe.com/...`
   - Vérifier que la redirection fonctionne vers Stripe Checkout

---

## 🚨 Si le problème persiste

### RLS toujours bloqué ?

1. Vérifier que RLS est activé :
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'commandes_lignes';
   ```
   `rowsecurity` doit être `true`

2. Vérifier les politiques existantes :
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'commandes_lignes';
   ```

3. Tester l'insertion manuellement :
   ```sql
   -- En tant qu'admin ou avec service_role
   INSERT INTO commandes_lignes (commande_id, produit_id, quantite, prix_unitaire_ht, total_ligne_ht)
   VALUES (
     'UUID-DE-TEST',
     'UUID-PRODUIT',
     1,
     100.00,
     100.00
   );
   ```

### Stripe toujours en erreur ?

1. Vérifier que l'Edge Function retourne bien l'URL :
   - Dashboard → Edge Functions → Logs
   - Vérifier la réponse JSON contient `url`

2. Vérifier la version de Stripe.js :
   ```bash
   npm list @stripe/stripe-js
   ```

3. Tester manuellement l'URL retournée :
   - Copier l'URL depuis les logs
   - Ouvrir dans un navigateur
   - Vérifier que ça redirige vers Stripe Checkout

---

## ✅ Résultat attendu

Après les corrections :
- ✅ Les lignes de commande sont créées sans erreur 403
- ✅ La redirection vers Stripe Checkout fonctionne sans erreur `redirectToCheckout`
- ✅ Le paiement peut être complété sur la page Stripe
- ✅ L'utilisateur est redirigé vers `/paiement/succes` après paiement



























