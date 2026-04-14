# ✅ Guide de Vérification - Paiement Stripe & Mode Rappel

## 📋 Checklist de Configuration

### 1. Variables d'environnement Front-end (`.env`)

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Où trouver** : Dashboard Stripe → Developers → API keys → Publishable key (mode test)

---

### 2. Secrets Supabase Edge Function

Dans **Supabase Dashboard → Edge Functions → Secrets**, configurer :

- **`STRIPE_SECRET_KEY`** : `sk_test_...` (Dashboard Stripe → Developers → API keys → Secret key)
- **`SITE_URL`** : 
  - Production : `https://groupe-effinor.fr`
  - Local : `http://localhost:3000` (pour tests locaux)

**Note** : Les secrets `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

---

### 3. Migration SQL

**À exécuter dans Supabase SQL Editor** :

Le fichier `commandes_add_payment_fields.sql` doit être exécuté pour ajouter les colonnes nécessaires :
- `type_commande`
- `mode_suivi`
- `paiement_statut`
- `stripe_session_id`
- `stripe_payment_intent_id`

---

### 4. Déploiement Edge Function

```bash
# Si vous utilisez Supabase CLI
supabase functions deploy create-stripe-checkout
```

Ou via le dashboard Supabase : Edge Functions → create-stripe-checkout → Deploy

---

## 🧪 Tests - Mode Paiement Stripe

### Étape 1 : Préparation du panier

1. Aller sur `/boutique`
2. Ajouter 2-3 produits au panier (avec prix > 0)
3. Vérifier que le panier affiche bien les produits avec prix HT et TTC

### Étape 2 : Formulaire de commande

1. Aller sur `/panier`
2. Remplir **tous les champs obligatoires** :
   - Nom complet *
   - Raison sociale *
   - SIRET *
   - Email *
   - Téléphone *
   - Adresse ligne 1 *
   - Code postal *
   - Ville *
   - Type de bâtiment *
3. Optionnel : Cocher "Adresse de facturation différente" et remplir les champs

### Étape 3 : Paiement Stripe

1. Cliquer sur **"Payer maintenant par carte"**
2. ✅ **Vérification 1** : Le bouton doit afficher "Traitement en cours..."
3. ✅ **Vérification 2** : Redirection vers Stripe Checkout
4. Dans Stripe Checkout, utiliser une carte de test :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date** : N'importe quelle date future (ex: 12/25)
   - **CVC** : `123`
   - **Nom** : N'importe quel nom
5. Cliquer sur "Payer"
6. ✅ **Vérification 3** : Redirection vers `/paiement/succes?session_id=cs_...`

### Étape 4 : Contrôles dans Supabase

**Table `public.commandes`** :

```sql
SELECT 
  id,
  reference,
  type_commande,
  mode_suivi,
  paiement_statut,
  stripe_session_id,
  total_ht,
  total_ttc,
  nb_articles,
  created_at
FROM public.commandes
ORDER BY created_at DESC
LIMIT 1;
```

**Vérifications attendues** :
- ✅ `type_commande` = `'commande'`
- ✅ `mode_suivi` = `'paiement_en_ligne'`
- ✅ `paiement_statut` = `'en_attente'` (sera mis à `'payee'` via webhook plus tard)
- ✅ `stripe_session_id` rempli (commence par `cs_`)
- ✅ `total_ht` et `total_ttc` corrects
- ✅ `nb_articles` correspond au nombre de produits

**Table `public.commandes_lignes`** :

```sql
SELECT 
  id,
  commande_id,
  product_id,
  quantite,
  prix_unitaire_ht,
  total_ligne_ht,
  meta
FROM public.commandes_lignes
WHERE commande_id = '<id_de_la_commande>'
ORDER BY created_at;
```

**Vérifications attendues** :
- ✅ Toutes les lignes du panier sont présentes
- ✅ `quantite` correcte pour chaque produit
- ✅ `prix_unitaire_ht` et `total_ligne_ht` corrects
- ✅ `meta` contient `nom`, `reference`, `marque`, `usage`

### Étape 5 : Contrôles dans l'Admin

1. Aller sur `/admin/orders`
2. ✅ **Vérification** : La nouvelle commande apparaît dans la liste
3. ✅ **Colonne "Mode"** : Badge bleu "Paiement en ligne"
4. ✅ **Colonne "Statut"** : Badge "Nouvelle"
5. Cliquer sur la commande pour voir le détail
6. ✅ **Dans la section "Statistiques"** :
   - Mode de traitement : Badge "Paiement en ligne"
   - Statut paiement : Badge jaune "En attente"

---

## 🧪 Tests - Mode Rappel

### Étape 1-2 : Identiques au mode Stripe (panier + formulaire)

### Étape 3 : Mode Rappel

1. Cliquer sur **"Être rappelé par un expert"**
2. ✅ **Vérification 1** : Le bouton doit afficher "Traitement en cours..."
3. ✅ **Vérification 2** : Toast "✅ Commande enregistrée !"
4. ✅ **Vérification 3** : Redirection vers `/merci` après 1.5 secondes

### Étape 4 : Page Thank You

1. ✅ **Vérification** : Le message affiche :
   - "Votre commande a été enregistrée avec succès. Un expert va vous rappeler pour finaliser votre commande."
2. ✅ **Section "Prochaines étapes"** affiche :
   - Un expert vous contactera dans les plus brefs délais (sous 24h ouvrées)
   - Il finalisera avec vous les détails de votre commande
   - Votre commande sera ensuite préparée et expédiée rapidement

### Étape 5 : Contrôles dans Supabase

**Table `public.commandes`** :

```sql
SELECT 
  id,
  reference,
  type_commande,
  mode_suivi,
  paiement_statut,
  stripe_session_id,
  total_ht,
  total_ttc,
  nb_articles
FROM public.commandes
ORDER BY created_at DESC
LIMIT 1;
```

**Vérifications attendues** :
- ✅ `type_commande` = `'commande'`
- ✅ `mode_suivi` = `'rappel'`
- ✅ `paiement_statut` = `'en_attente'`
- ✅ `stripe_session_id` = `NULL` (pas de session Stripe)
- ✅ `total_ht` et `total_ttc` corrects
- ✅ `nb_articles` correspond au nombre de produits

**Table `public.commandes_lignes`** : Identique au mode Stripe (toutes les lignes présentes)

### Étape 6 : Contrôles dans l'Admin

1. Aller sur `/admin/orders`
2. ✅ **Vérification** : La nouvelle commande apparaît dans la liste
3. ✅ **Colonne "Mode"** : Badge orange "À rappeler"
4. ✅ **Colonne "Statut"** : Badge "Nouvelle"
5. Cliquer sur la commande pour voir le détail
6. ✅ **Dans la section "Statistiques"** :
   - Mode de traitement : Badge "Rappel téléphonique"
   - Statut paiement : Badge jaune "En attente"

---

## 🐛 Dépannage

### Problème : "Stripe n'est pas disponible"

**Solution** :
- Vérifier que `VITE_STRIPE_PUBLIC_KEY` est bien dans `.env`
- Redémarrer le serveur de dev après modification de `.env`
- Vérifier que la clé commence par `pk_test_` (mode test) ou `pk_live_` (production)

### Problème : "Stripe n'est pas configuré" (Edge Function)

**Solution** :
- Vérifier que le secret `STRIPE_SECRET_KEY` est bien configuré dans Supabase Edge Functions → Secrets
- Vérifier que la clé commence par `sk_test_` (mode test) ou `sk_live_` (production)
- Redéployer l'Edge Function après ajout du secret

### Problème : Erreur "Le montant de la commande doit être supérieur à 0"

**Solution** :
- Vérifier que les produits dans le panier ont un `prix > 0`
- Vérifier que `total_ttc` est bien calculé dans la commande (total_ht * 1.2)

### Problème : Redirection vers Stripe ne fonctionne pas

**Solution** :
- Vérifier la console du navigateur pour les erreurs
- Vérifier que `stripePromise` est bien initialisé avec une clé valide
- Vérifier que `sessionId` est bien retourné par l'Edge Function

### Problème : Commande créée mais pas de lignes dans `commandes_lignes`

**Solution** :
- Vérifier les logs de la console pour les erreurs
- Vérifier que la table `commandes_lignes` existe bien
- Vérifier les permissions RLS sur `commandes_lignes`

---

## ✅ Points de Vérification Rapide

- [ ] Migration SQL exécutée (`commandes_add_payment_fields.sql`)
- [ ] `.env` contient `VITE_STRIPE_PUBLIC_KEY`
- [ ] Secrets Supabase Edge Functions configurés (`STRIPE_SECRET_KEY`, `SITE_URL`)
- [ ] Edge Function `create-stripe-checkout` déployée
- [ ] Test mode Stripe : Redirection vers Checkout ✅
- [ ] Test mode Stripe : Commande créée dans Supabase ✅
- [ ] Test mode Stripe : Lignes de commande créées ✅
- [ ] Test mode Stripe : Affichage correct dans l'admin ✅
- [ ] Test mode Rappel : Redirection vers `/merci` ✅
- [ ] Test mode Rappel : Commande créée avec `mode_suivi = 'rappel'` ✅
- [ ] Test mode Rappel : Affichage correct dans l'admin ✅

---

## 📝 Notes Importantes

1. **Webhook Stripe** : La mise à jour automatique de `paiement_statut` à `'payee'` se fera via un webhook Stripe (à implémenter plus tard). Pour l'instant, le statut reste `'en_attente'` même après paiement réussi.

2. **Mode Test Stripe** : Utiliser les clés `pk_test_` et `sk_test_` pour les tests. En production, remplacer par `pk_live_` et `sk_live_`.

3. **Cartes de test Stripe** :
   - Succès : `4242 4242 4242 4242`
   - Échec : `4000 0000 0000 0002`
   - Requiert authentification 3D Secure : `4000 0025 0000 3155`

4. **Validation** : Tous les champs marqués `*` sont obligatoires. Le formulaire ne peut pas être soumis sans les remplir.

5. **Adresse de facturation** : Si "Adresse de facturation différente" est cochée, tous les champs de facturation deviennent obligatoires.



























