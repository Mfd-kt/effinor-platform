# ✅ Checklist - Flux de Paiement Stripe

Ce document liste les vérifications nécessaires pour que le flux de paiement fonctionne correctement.

---

## 🔐 Variables d'environnement

### Front-end (`.env`)

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Important** :
- ⚠️ Penser à **relancer `npm run dev`** après modification de `.env`
- La clé doit commencer par `pk_test_` (mode test) ou `pk_live_` (production)
- Si la clé est vide ou manquante, le bouton "Payer maintenant par carte" affichera une erreur et proposera le mode rappel

### Supabase Edge Functions (Secrets)

Dans **Supabase Dashboard → Edge Functions → Secrets** :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe | `whsec_...` |
| `SITE_URL` | URL du site | `https://groupe-effinor.fr` |

---

## 🗄️ Base de données

### Migration SQL

**Fichier** : `migrations/20251126_add_meta_to_commandes_lignes.sql`

**À exécuter dans Supabase SQL Editor** :

```sql
-- Ajouter la colonne meta à commandes_lignes
ALTER TABLE public.commandes_lignes
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Mettre à jour les anciennes lignes
UPDATE public.commandes_lignes
  SET meta = '{}'::jsonb
  WHERE meta IS NULL;

-- Créer l'index GIN
CREATE INDEX IF NOT EXISTS commandes_lignes_meta_gin_idx
  ON public.commandes_lignes
  USING gin (meta);
```

**Vérification** :
```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commandes_lignes' 
  AND column_name = 'meta';

-- Devrait retourner : meta | jsonb
```

---

## 🧪 Tests

### 1. Test Mode Rappel

**Scénario** :
1. Ajouter des produits au panier
2. Remplir le formulaire complet
3. Cliquer sur **"Être rappelé par un expert"**

**Vérifications** :
- ✅ Commande créée dans `public.commandes` avec :
  - `type_commande = 'commande'`
  - `mode_suivi = 'rappel'`
  - `paiement_statut = 'en_attente'`
- ✅ Lignes créées dans `public.commandes_lignes` avec colonne `meta` remplie
- ✅ Redirection vers `/merci` avec message adapté
- ✅ Dans l'admin : badge "À rappeler" visible

**Requête SQL de vérification** :
```sql
SELECT 
  id,
  reference,
  type_commande,
  mode_suivi,
  paiement_statut,
  total_ht,
  total_ttc,
  nb_articles
FROM public.commandes
ORDER BY created_at DESC
LIMIT 1;
```

---

### 2. Test Mode Paiement en Ligne

**Scénario** :
1. Ajouter des produits au panier (avec prix > 0)
2. Remplir le formulaire complet
3. Cliquer sur **"Payer maintenant par carte"**

**Vérifications étape par étape** :

#### Étape 1 : Création de la commande
- ✅ Commande créée dans `public.commandes` avec :
  - `type_commande = 'commande'`
  - `mode_suivi = 'paiement_en_ligne'`
  - `paiement_statut = 'en_attente'`
  - `total_ttc > 0`

#### Étape 2 : Création des lignes
- ✅ Lignes créées dans `public.commandes_lignes` :
  - Pas d'erreur 400 sur la colonne `meta`
  - Chaque ligne a `meta` avec `nom`, `reference`, `marque`, `usage`

**Requête SQL de vérification** :
```sql
SELECT 
  cl.id,
  cl.commande_id,
  cl.product_id,
  cl.quantite,
  cl.prix_unitaire_ht,
  cl.total_ligne_ht,
  cl.meta
FROM public.commandes_lignes cl
WHERE cl.commande_id = '<order_id>'
ORDER BY cl.created_at;
```

#### Étape 3 : Appel Edge Function
- ✅ Console log : `[Cart] Calling create-stripe-checkout`
- ✅ Pas d'erreur dans la console
- ✅ Réponse avec `sessionId`

#### Étape 4 : Redirection Stripe
- ✅ Console log : `[Cart] Stripe session created`
- ✅ Console log : `[Stripe] redirectToCheckout ok`
- ✅ Redirection vers Stripe Checkout (URL commence par `https://checkout.stripe.com`)

#### Étape 5 : Paiement test
- ✅ Utiliser carte test : `4242 4242 4242 4242`
- ✅ Date future (ex: 12/25)
- ✅ CVC : `123`
- ✅ Redirection vers `/paiement/succes?session_id=cs_...`

#### Étape 6 : Vérification après paiement
- ✅ Dans Supabase : `paiement_statut = 'payee'` (via webhook)
- ✅ `stripe_session_id` rempli
- ✅ `stripe_payment_intent_id` rempli (si disponible)

---

## 🐛 Dépannage

### Erreur : "PGRST204: Could not find the 'meta' column"

**Cause** : La migration SQL n'a pas été exécutée.

**Solution** :
1. Exécuter `migrations/20251126_add_meta_to_commandes_lignes.sql` dans Supabase SQL Editor
2. Vérifier avec la requête SQL ci-dessus

---

### Erreur : "Please call Stripe() with your publishable key. You used an empty string."

**Cause** : `VITE_STRIPE_PUBLIC_KEY` est vide ou manquante.

**Solutions** :
1. Vérifier que `.env` contient bien `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
2. **Redémarrer le serveur de dev** : `npm run dev`
3. Vérifier dans la console : `console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)`

**Note** : Le code affiche maintenant un message clair et propose le mode rappel si la clé est manquante.

---

### Erreur : "Missing sessionId from Edge Function"

**Causes possibles** :
1. L'Edge Function `create-stripe-checkout` n'est pas déployée
2. Les secrets Supabase ne sont pas configurés (`STRIPE_SECRET_KEY`)
3. La commande n'a pas de `total_ttc > 0`

**Solutions** :
1. Vérifier que l'Edge Function est déployée : `supabase functions deploy create-stripe-checkout`
2. Vérifier les secrets dans Supabase Dashboard
3. Vérifier les logs de l'Edge Function dans Supabase Dashboard

---

### Erreur : "Failed to initialize Stripe.js"

**Causes possibles** :
1. La clé publique Stripe est invalide
2. Problème de connexion réseau
3. Script Stripe.js non chargé

**Solutions** :
1. Vérifier que la clé commence par `pk_test_` ou `pk_live_`
2. Vérifier la console du navigateur pour d'autres erreurs
3. Essayer en navigation privée (cache)

---

### Les lignes de commande ne sont pas créées

**Vérifications** :
1. Vérifier les logs dans la console : `[Cart] Error creating order lines`
2. Vérifier que la colonne `meta` existe bien dans `commandes_lignes`
3. Vérifier les permissions RLS sur `commandes_lignes`

**Requête de debug** :
```sql
-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commandes_lignes'
ORDER BY ordinal_position;
```

---

## 📊 Logs à surveiller

### Console du navigateur

Lors d'un paiement en ligne, vous devriez voir dans l'ordre :

1. `[Cart] handleSubmit called with mode: stripe`
2. `[Cart] Starting order submission, mode: stripe`
3. `[Cart] Order created { orderId, reference }`
4. `[Cart] Order lines created successfully { count, orderId }`
5. `[Cart] Calling create-stripe-checkout { commande_id }`
6. `[Cart] Stripe session created { sessionId }`
7. `[Stripe] redirectToCheckout ok`

### Logs Supabase Edge Function

Dans **Supabase Dashboard → Edge Functions → create-stripe-checkout → Logs** :

- Vérifier qu'il n'y a pas d'erreur lors de la création de la session
- Vérifier que `sessionId` est bien retourné

---

## ✅ Checklist finale

Avant de considérer le flux comme fonctionnel :

- [ ] Migration SQL `20251126_add_meta_to_commandes_lignes.sql` exécutée
- [ ] `VITE_STRIPE_PUBLIC_KEY` configurée dans `.env`
- [ ] Serveur de dev redémarré après modification `.env`
- [ ] Secrets Supabase configurés (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Edge Function `create-stripe-checkout` déployée
- [ ] Test mode rappel : ✅ Commande créée, redirection `/merci`
- [ ] Test mode paiement : ✅ Commande créée, lignes créées, redirection Stripe
- [ ] Test paiement complet : ✅ Paiement test, redirection `/paiement/succes`
- [ ] Vérification admin : ✅ Badges et statuts corrects

---

## 📝 Notes importantes

1. **Mode test vs Production** : Utiliser `pk_test_` et `sk_test_` pour les tests. En production, remplacer par `pk_live_` et `sk_live_`.

2. **Redémarrage serveur** : Toujours redémarrer `npm run dev` après modification de `.env`.

3. **Idempotence** : Le code est idempotent - si une commande est déjà créée, les erreurs sur les lignes ne bloquent pas l'utilisateur.

4. **Fallback** : Si Stripe n'est pas disponible, le code propose automatiquement le mode rappel.

---

Pour toute question ou problème, consulter les logs dans la console du navigateur et dans Supabase Dashboard.



























