# 🔧 Corrections Urgentes - Problèmes de Paiement

D'après les logs de la console, voici les problèmes identifiés et les corrections à appliquer :

---

## ❌ Problème 1 : Colonnes manquantes dans `commandes_lignes`

**Erreurs** : 
- `PGRST204: Could not find the 'prix_unitaire_ht' column of 'commandes_lignes'`
- `PGRST204: Could not find the 'product_id' column of 'commandes_lignes'`

**Solution** : Exécuter la migration SQL `migrations/20251126_fix_commandes_lignes_columns.sql`

Cette migration ajoute :
- `prix_unitaire_ht NUMERIC(10,2)`
- `total_ligne_ht NUMERIC(10,2)`
- `produit_id UUID` (ou renomme `product_id` en `produit_id` si nécessaire)
- `meta JSONB` (si pas déjà fait)

**⚠️ IMPORTANT** : Le nom de colonne dans la base est `produit_id` (français), pas `product_id`.

**Action immédiate** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier/coller le contenu de `migrations/20251126_fix_commandes_lignes_columns.sql`
3. Exécuter la migration

---

## ❌ Problème 2 : Clé Stripe manquante

**Erreur** : `[Stripe] VITE_STRIPE_PUBLIC_KEY is missing or empty`

**Solution** :
1. Vérifier que `.env` contient : `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
2. **REDÉMARRER** le serveur de dev : `npm run dev`

**Vérification** :
```javascript
// Dans la console du navigateur
console.log('Stripe key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);
```

Si `undefined`, la clé n'est pas chargée → redémarrer le serveur.

---

## ❌ Problème 3 : `total_ht: undefined`

**Cause** : Le calcul du total HT échoue ou n'est pas retourné par Supabase

**Solution appliquée** :
- Le code utilise maintenant `orderData.total_ht` avec un fallback sur le calcul local
- Ajout de logs pour debugger le calcul

**Vérification** :
- Regarder les logs `[Cart] Cart totals calculated` pour voir le `totalHt` calculé
- Regarder les logs `[Cart] Order created successfully` pour voir ce que Supabase retourne

---

## 📝 Checklist de correction

### 1. Exécuter les migrations SQL

**Migration 1** : `migrations/20251126_add_meta_to_commandes_lignes.sql`
- Ajoute la colonne `meta` JSONB

**Migration 2** : `migrations/20251126_fix_commandes_lignes_columns.sql`
- Ajoute `prix_unitaire_ht` et `total_ligne_ht`

### 2. Vérifier `.env`

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### 4. Tester à nouveau

1. Ouvrir la console (F12)
2. Ajouter produits au panier
3. Remplir formulaire
4. Cliquer "Payer maintenant par carte"
5. Vérifier les logs dans la console

---

## 🔍 Logs attendus après correction

Si tout fonctionne, vous devriez voir :

```
[Cart] handleSubmit called with mode: stripe
[Cart] Form validation result: true {}
[Cart] Starting order submission, mode: stripe
[Cart] Cart totals calculated { totalHt: 100, nbArticles: 2, cartItems: 2 }
[Cart] Order created successfully { orderId: '...', reference: 'CMD-...', total_ht: 100, total_ttc: 120, mode: 'stripe' }
[Cart] Order lines created successfully { count: 2, orderId: '...' }
[Cart] Calling create-stripe-checkout { commande_id: '...', total_ttc: 120 }
[Cart] Stripe session created successfully { sessionId: 'cs_test_...' }
[Stripe] Loading Stripe.js with key: pk_test_...
[Stripe] Stripe.js initialized successfully
[Stripe] Redirecting to Checkout with sessionId: cs_test_...
[Stripe] redirectToCheckout called successfully - redirection should happen now
```

---

## 🚨 Si le problème persiste

1. **Vérifier les migrations** :
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'commandes_lignes'
   ORDER BY ordinal_position;
   ```
   Doit contenir : `prix_unitaire_ht`, `total_ligne_ht`, `meta`

2. **Vérifier la clé Stripe** :
   - Dans `.env` : `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
   - Serveur redémarré après modification
   - Pas d'espaces avant/après la clé

3. **Vérifier les logs Supabase Edge Function** :
   - Dashboard → Edge Functions → `create-stripe-checkout` → Logs
   - Vérifier qu'il n'y a pas d'erreur côté serveur

