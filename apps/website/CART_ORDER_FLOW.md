# 📦 Flux de Commande E-commerce - Documentation

## Vue d'ensemble

Ce document décrit le flux complet de gestion du panier et des commandes dans l'application Effinor Lighting.

---

## 🛒 Architecture du Panier

### CartContext (`src/contexts/CartContext.jsx`)

Le panier est géré via un **React Context** avec persistance dans `localStorage`.

#### Structure d'un item dans le panier

```javascript
{
  id: string,              // UUID du produit
  nom: string,            // Nom du produit
  reference: string | null, // Référence produit
  marque: string | null,   // Marque du produit
  prix: number | null,      // Prix HT (peut être 0 ou null si sur_devis)
  sur_devis: boolean,      // Si true, pas de prix affiché
  image_url: string | null, // URL de l'image
  slug: string | null,     // Slug pour la page produit
  categorie: string | null, // Catégorie produit
  usage: string | null,     // 'industriel' | 'tertiaire' | 'agricole'
  quantity: number         // Quantité (minimum 1)
}
```

#### Méthodes disponibles

- `addToCart(product, quantity = 1)` - Ajoute un produit au panier
- `removeFromCart(productId)` - Supprime un produit du panier
- `updateQuantity(productId, quantity)` - Met à jour la quantité
- `clearCart()` - Vide le panier
- `getTotalItems()` - Retourne le nombre total d'items
- `getTotalPrice()` - Calcule le total HT (ignore les produits sur_devis)

#### Persistance localStorage

- **Clé** : `effinor_cart`
- **Format** : JSON array des items
- **Chargement** : Au montage du composant
- **Sauvegarde** : À chaque modification du panier

---

## 📋 Flux de Commande

### 1. Ajout au Panier (`ProductDetail.jsx`)

**Étape** : Utilisateur clique sur "Ajouter au panier"

```javascript
const handleAddToCart = () => {
  if (!product) return;
  addToCart(product);
  toast({
    title: "✅ Produit ajouté au panier !",
    description: `${product.nom} a été ajouté. Vous pouvez continuer vos achats ou finaliser votre demande de devis.`,
  });
};
```

**Actions** :
- Normalisation des données produit (ajout `reference`, `marque`, `usage`)
- Détection automatique de l'usage depuis la catégorie si manquant
- Sauvegarde dans localStorage
- Toast de confirmation
- Mise à jour du badge panier dans le Header

---

### 2. Page Panier (`Cart.jsx`)

**Route** : `/panier`

#### Affichage

- **Panier vide** : Message + lien vers `/boutique`
- **Panier avec produits** :
  - Liste des produits avec image, nom, marque, référence, usage
  - Quantité modifiable (+/-)
  - Prix unitaire et total par ligne
  - Prix total HT (ou "Sur demande" si produits sur_devis)
  - Bouton "Continuer mes achats" → `/boutique`

#### Formulaire de Devis

**Champs obligatoires** :
- Nom complet
- Email (validation format)
- Téléphone (validation format français)

**Champs optionnels** :
- Raison sociale
- SIRET (14 chiffres, validation si renseigné)
- Secteur d'activité (select : Industrie, Logistique, Commerce, Tertiaire, Agricole, Autre)
- Code postal (5 chiffres, validation si renseigné)
- Ville
- Type de bâtiment (select : Entrepôt, Bureau, Atelier, Serre, Autre)
- Message libre

**Validation** :
- Côté client avant soumission
- Messages d'erreur contextuels
- Sanitization des données avant envoi

---

### 3. Soumission de la Commande

**Fonction** : `handleSubmitOrder()` dans `Cart.jsx`

#### Étapes

1. **Validation du formulaire**
   ```javascript
   if (!validateForm()) {
     toast({ title: "Informations manquantes", ... });
     return;
   }
   ```

2. **Vérification panier non vide**
   ```javascript
   if (cart.length === 0) {
     toast({ title: "Panier vide", ... });
     return;
   }
   ```

3. **Préparation des données**
   ```javascript
   const orderDataToInsert = {
     nom_client: formData.name,
     email: formData.email,
     telephone: formData.phone,
     societe: formData.company || null,
     numero_siret: formData.siret ? formData.siret.replace(/\s/g, '') : null,
     code_postal: formData.postalCode || null,
     ville: formData.city || null,
     type_batiment: formData.typeBatiment || null,
     secteur_activite: formData.secteur || null,
     commentaire: formData.message || null,
     produits: cart.map(item => ({
       id: item.id,
       nom: item.nom,
       reference: item.reference || null,
       marque: item.marque || null,
       usage: item.usage || null,
       quantite: item.quantity
     })),
     statut: 'Nouveau Devis',
     source: 'Panier / Demande de devis'
   };
   ```

4. **Sanitization**
   ```javascript
   const sanitizedOrderData = sanitizeFormData(orderDataToInsert);
   ```

5. **Insertion dans Supabase**
   ```javascript
   const { data: orderData, error: orderError } = await supabase
     .from('commandes')
     .insert([sanitizedOrderData])
     .select('id')
     .single();
   ```

6. **Création des lignes de commande**
   ```javascript
   const lines = cart.map(item => ({
     commande_id: orderData.id,
     produit_id: item.id,
     quantite: item.quantity,
     prix_unitaire: item.prix || 0,
     nom: item.nom || ''
   }));
   
   await supabase
     .from('commandes_lignes')
     .insert(lines);
   ```

7. **Nettoyage et redirection**
   ```javascript
   clearCart();
   setFormData({ ... }); // Reset form
   
   setTimeout(() => {
     navigate('/merci', {
       state: {
         orderId: orderData.id,
         companyName: formData.company || formData.name,
         orderType: 'devis'
       }
     });
   }, 1500);
   ```

---

### 4. Page de Confirmation (`ThankYou.jsx`)

**Route** : `/merci`

#### Gestion des deux types de demandes

La page accepte deux types de demandes :

1. **Commandes/Devis** (depuis le panier)
   - `orderId` : UUID de la commande
   - `orderType: 'devis'`
   - Message : "Votre demande de devis a été envoyée avec succès"

2. **Leads CEE** (depuis le formulaire CEE)
   - `leadId` : UUID du lead
   - `ceePotential` : Données d'estimation CEE (optionnel)
   - Message : "Votre demande a été envoyée avec succès"

#### Affichage

- ✅ Icône de succès animée
- Message personnalisé avec nom du client
- Référence de la demande (orderId ou leadId)
- Boutons d'action :
  - "Retour à l'accueil" → `/`
  - "Voir la boutique" → `/boutique`
- Section "Prochaines étapes" (si applicable)
- Coordonnées de contact

---

## 🗄️ Structure Base de Données

### Table `commandes`

```sql
CREATE TABLE commandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_client TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  societe TEXT,
  numero_siret TEXT,
  code_postal TEXT,
  ville TEXT,
  type_batiment TEXT,
  secteur_activite TEXT,
  commentaire TEXT,
  produits JSONB, -- Array des produits avec détails
  statut TEXT DEFAULT 'Nouveau Devis',
  source TEXT DEFAULT 'Panier / Demande de devis',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `commandes_lignes`

```sql
CREATE TABLE commandes_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id UUID REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES products(id),
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10,2) DEFAULT 0,
  nom TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔔 Notifications & Webhooks

### Option 1 : Webhook Supabase → N8N (Recommandé)

**Configuration** :
1. Supabase Dashboard → Database → Webhooks
2. Créer un webhook sur la table `commandes`
3. Trigger : `INSERT`
4. URL : Votre webhook N8N
5. Payload : Toute la ligne de commande

**Avantages** :
- Pas de code supplémentaire
- Gestion centralisée dans N8N
- Envoi d'emails, notifications Slack, etc.

### Option 2 : Edge Function Supabase

Une Edge Function peut être créée pour envoyer des emails directement depuis Supabase.

**Fichier** : `supabase/functions/send-order-notification/index.ts`

**Appel depuis le frontend** (optionnel) :
```javascript
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-order-notification`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ orderId: orderData.id })
  }
);
```

**Note** : Pour l'instant, l'envoi se fait directement en base. Les notifications peuvent être gérées via webhook N8N.

---

## 🧪 Tests Manuels

### Scénario 1 : Ajout au panier

1. Aller sur une fiche produit (`/boutique/[slug]`)
2. Cliquer sur "Ajouter au panier"
3. ✅ Toast de confirmation s'affiche
4. ✅ Badge panier dans le Header se met à jour
5. ✅ Recharger la page → panier toujours présent (localStorage)

### Scénario 2 : Modification du panier

1. Aller sur `/panier`
2. Modifier la quantité d'un produit (+/-)
3. ✅ Prix total se met à jour
4. Supprimer un produit
5. ✅ Produit retiré, total recalculé

### Scénario 3 : Soumission de commande

1. Remplir le formulaire avec :
   - Nom : "Jean Dupont"
   - Email : "jean@example.com"
   - Téléphone : "0612345678"
   - SIRET : "12345678901234"
   - Code postal : "75001"
   - Ville : "Paris"
2. Cliquer sur "Demander un devis"
3. ✅ Toast de succès
4. ✅ Redirection vers `/merci` après 1.5s
5. ✅ Panier vidé
6. ✅ Formulaire réinitialisé
7. ✅ Vérifier dans Supabase : nouvelle ligne dans `commandes` et `commandes_lignes`

### Scénario 4 : Validation

1. Tester avec email invalide → erreur
2. Tester avec téléphone invalide → erreur
3. Tester avec SIRET invalide (13 chiffres) → erreur
4. Tester avec code postal invalide (4 chiffres) → erreur
5. Tester avec panier vide → erreur

---

## 🐛 Gestion d'Erreurs

### Erreurs possibles

1. **Erreur Supabase INSERT**
   - Log dans la console (via `logger.error()`)
   - Toast d'erreur à l'utilisateur
   - Panier et formulaire conservés (pas de perte de données)

2. **Erreur création lignes de commande**
   - Log uniquement (la commande est créée)
   - Pas de rollback automatique (à améliorer en production)

3. **Erreur localStorage**
   - Try/catch dans CartContext
   - Log silencieux si localStorage corrompu
   - Panier réinitialisé si données invalides

---

## 📊 Points d'Amélioration Futurs

### Court terme

- [ ] Transaction SQL pour garantir cohérence (commande + lignes)
- [ ] Retry automatique en cas d'erreur réseau
- [ ] Sauvegarde du panier côté serveur (pour utilisateurs connectés)

### Moyen terme

- [ ] Edge Function pour notifications email
- [ ] Webhook N8N configuré
- [ ] Tracking analytics (ajout panier, conversion)

### Long terme

- [ ] Paiement en ligne (Stripe)
- [ ] Gestion des stocks
- [ ] Commandes récurrentes

---

## 📝 Notes Techniques

### Sanitization

Toutes les données utilisateur sont sanitizées avant insertion via `sanitizeFormData()` de `src/utils/sanitize.js`.

### Logging

Les erreurs sont loggées via `logger.error()` de `src/utils/logger.js`.

### Performance

- Panier en localStorage (pas de requête serveur)
- Pas de re-render inutile (Context optimisé)
- Lazy loading des images produits

---

## 🔗 Fichiers Clés

- `src/contexts/CartContext.jsx` - Gestion du panier
- `src/pages/Cart.jsx` - Page panier + formulaire
- `src/pages/ProductDetail.jsx` - Ajout au panier
- `src/pages/ThankYou.jsx` - Page de confirmation
- `src/components/Header.jsx` - Badge panier
- `src/utils/sanitize.js` - Sanitization
- `src/utils/formUtils.js` - Validation formulaires

---

**Dernière mise à jour** : Décembre 2024



























