# 🔍 Guide de Debug - Paiement Stripe

## 📋 Vérifications à faire quand le paiement ne fonctionne pas

### 1. Ouvrir la Console du Navigateur

**Chrome/Edge** : `F12` ou `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
**Firefox** : `F12` ou `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
**Safari** : `Cmd+Option+C` (après avoir activé le menu Développement)

### 2. Filtrer les logs

Dans la console, rechercher les logs qui commencent par :
- `[Cart]`
- `[Stripe]`

### 3. Séquence de logs attendue

Quand vous cliquez sur "Payer maintenant par carte", vous devriez voir dans l'ordre :

```
[Cart] handleSubmit called with mode: stripe
🔵 Validation formulaire: true {...}
[Cart] Starting order submission, mode: stripe
[Cart] Order created successfully { orderId, reference, total_ht, total_ttc, mode }
[Cart] Order lines created successfully { count, orderId }
[Cart] Calling create-stripe-checkout { commande_id, total_ttc }
[Cart] Edge Function response (raw): {...}
[Cart] Edge Function response (stringified): {...}
[Cart] Stripe session created successfully { sessionId }
[Stripe] Loading Stripe.js with key: pk_test_...
[Stripe] Stripe.js initialized successfully
[Stripe] Redirecting to Checkout with sessionId: cs_...
[Stripe] redirectToCheckout called successfully - redirection should happen now
```

---

## 🐛 Erreurs courantes et solutions

### ❌ Erreur : "VITE_STRIPE_PUBLIC_KEY is missing or empty"

**Log** : `[Stripe] VITE_STRIPE_PUBLIC_KEY is missing or empty`

**Solution** :
1. Vérifier que `.env` contient : `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
2. **REDÉMARRER** le serveur : `npm run dev`
3. Vérifier dans la console : `console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)`

---

### ❌ Erreur : "Edge Function error"

**Log** : `[Cart] Edge Function error (detailed): {...}`

**Vérifications** :
1. L'Edge Function `create-stripe-checkout` est-elle déployée ?
   - Dashboard Supabase → Edge Functions → `create-stripe-checkout`
   - Vérifier les logs dans le Dashboard Supabase

2. Les secrets sont-ils configurés ?
   - Dashboard Supabase → Edge Functions → Secrets
   - Vérifier : `STRIPE_SECRET_KEY`, `SITE_URL`

3. La commande existe-t-elle dans `public.commandes` ?
   ```sql
   SELECT id, reference, total_ttc, stripe_session_id 
   FROM public.commandes 
   WHERE id = '<orderId>'
   ```

**Solution** :
- Vérifier les logs de l'Edge Function dans Supabase Dashboard
- Tester l'Edge Function avec curl :
  ```bash
  curl -X POST \
    'https://<PROJECT_REF>.supabase.co/functions/v1/create-stripe-checkout' \
    -H 'Authorization: Bearer <ANON_KEY>' \
    -H 'Content-Type: application/json' \
    -d '{"commande_id": "<orderId>"}'
  ```

---

### ❌ Erreur : "Missing sessionId from Edge Function"

**Log** : `[Cart] Missing sessionId from Edge Function`

**Causes possibles** :
1. L'Edge Function ne retourne pas `sessionId`
2. La structure de la réponse est différente

**Solution** :
1. Vérifier le log `[Cart] Edge Function response (stringified)` dans la console
2. Vérifier le code de l'Edge Function `create-stripe-checkout/index.ts` :
   - Elle doit retourner `{ sessionId: session.id }`
3. Vérifier les logs de l'Edge Function dans Supabase Dashboard

---

### ❌ Erreur : "Failed to initialize Stripe.js"

**Log** : `[Stripe] Failed to initialize Stripe.js`

**Causes possibles** :
1. La clé publique Stripe est invalide
2. Problème de connexion réseau
3. Script Stripe.js bloqué par un bloqueur de pub

**Solutions** :
1. Vérifier que la clé commence par `pk_test_` ou `pk_live_`
2. Vérifier la console pour d'autres erreurs réseau
3. Désactiver les bloqueurs de pub (AdBlock, uBlock, etc.)
4. Essayer en navigation privée

---

### ❌ Erreur : "redirectToCheckout error"

**Log** : `[Stripe] redirectToCheckout error (detailed): {...}`

**Causes possibles** :
1. Le `sessionId` est invalide
2. La session Stripe a expiré
3. Problème de configuration Stripe

**Solutions** :
1. Vérifier que le `sessionId` commence par `cs_`
2. Vérifier dans Stripe Dashboard → Developers → Events que la session a été créée
3. Vérifier que `SITE_URL` dans les secrets Supabase correspond à votre domaine

---

### ❌ Erreur : "PGRST204: Could not find the 'meta' column"

**Log** : Erreur dans la console ou dans les logs Supabase

**Solution** :
1. Exécuter la migration SQL : `migrations/20251126_add_meta_to_commandes_lignes.sql`
2. Vérifier que la colonne existe :
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'commandes_lignes' 
     AND column_name = 'meta';
   ```

---

## 🔍 Checklist de Debug

### Étape 1 : Vérifier la configuration

- [ ] `.env` contient `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
- [ ] Serveur redémarré après modification de `.env`
- [ ] Migration SQL exécutée (colonne `meta` dans `commandes_lignes`)
- [ ] Secrets Supabase configurés (`STRIPE_SECRET_KEY`, `SITE_URL`)
- [ ] Edge Function `create-stripe-checkout` déployée

### Étape 2 : Tester le flux

- [ ] Ouvrir la console du navigateur (F12)
- [ ] Ajouter des produits au panier
- [ ] Remplir le formulaire
- [ ] Cliquer sur "Payer maintenant par carte"
- [ ] Noter les logs qui apparaissent

### Étape 3 : Analyser les logs

**Si vous voyez** :
- ✅ `[Cart] handleSubmit called with mode: stripe` → Le bouton fonctionne
- ✅ `[Cart] Order created successfully` → La commande est créée
- ✅ `[Cart] Order lines created successfully` → Les lignes sont créées
- ✅ `[Cart] Calling create-stripe-checkout` → L'appel est fait
- ❌ Pas de réponse après → Problème Edge Function
- ❌ `Edge Function error` → Voir section ci-dessus
- ❌ `Missing sessionId` → Voir section ci-dessus

---

## 📞 Informations à fournir pour le debug

Si le problème persiste, fournir :

1. **Logs de la console** (copier/coller)
2. **Vérification des variables** :
   ```javascript
   console.log('VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'présente' : 'manquante');
   ```
3. **ID de la commande** créée (si disponible)
4. **Logs Supabase Edge Function** (Dashboard → Edge Functions → Logs)
5. **Message d'erreur exact** affiché dans le toast

---

## 🧪 Test rapide

Pour vérifier rapidement si Stripe fonctionne :

1. Ouvrir la console du navigateur
2. Exécuter :
   ```javascript
   console.log('Stripe key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 12));
   ```
3. Si `undefined` ou `null` → La clé n'est pas chargée (redémarrer le serveur)

---

## ⚡ Test de l'Edge Function directement

Pour tester l'Edge Function sans passer par le front :

```bash
# Récupérer l'orderId d'une commande récente
curl -X POST \
  'https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/create-stripe-checkout' \
  -H 'Authorization: Bearer <VOTRE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"commande_id": "<ORDER_ID>"}'
```

**Réponse attendue** :
```json
{
  "sessionId": "cs_test_..."
}
```

Si vous obtenez une erreur, vérifier :
- Les secrets Supabase (STRIPE_SECRET_KEY)
- Les logs de l'Edge Function dans Supabase Dashboard



























