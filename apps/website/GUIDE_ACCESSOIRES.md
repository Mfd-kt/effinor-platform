# 📖 Guide : Système d'Accessoires

## 🎯 Concept simple

**Les accessoires sont des produits normaux** qui peuvent être **liés à d'autres produits**.

**Exemple concret :**
- **Produit principal** : "Highbay LED 100W"
- **Accessoires** : "Kit de suspension", "Capteur de présence", "Boîtier DALI"

Quand un client regarde le Highbay LED, il voit aussi les accessoires compatibles.

---

## 📋 Étape 1 : Créer les produits accessoires

Les accessoires sont **des produits comme les autres** dans la table `products`.

### ✅ Déjà fait pour toi

J'ai créé un fichier SQL avec **20 accessoires** :
- `migrations/20251204_insert_product_accessories.sql`
  - 10 accessoires pour luminaires (catégorie `accessoires`)
  - 10 accessoires pour bornes de recharge (catégorie `accessoires_borne_recharge`)

### 🔧 Pour les ajouter dans Supabase

1. Ouvre Supabase → SQL Editor
2. Copie-colle le contenu de `migrations/20251204_insert_product_accessories.sql`
3. Clique sur "Run"

**Résultat :** Tu auras 20 nouveaux produits dans ta table `products`.

---

## 🔗 Étape 2 : Lier les accessoires aux produits

### Méthode 1 : Via l'interface Admin (RECOMMANDÉ) ✅

1. **Va dans l'admin** : `/admin/products` ou `/produits`
2. **Trouve un produit** (ex: "Highbay LED 100W")
3. **Clique sur l'icône 🔌** (PlugZap) à droite du produit
4. **Tu arrives sur** : `/produits/[productId]/accessoires`

**Sur cette page :**
- Tu vois la liste des accessoires déjà liés
- Tu peux **ajouter un accessoire** via le menu déroulant
- Tu peux **supprimer un accessoire** avec l'icône poubelle

**Exemple :**
- Produit : "Highbay LED 100W"
- Ajoute : "Kit de suspension pour Highbay"
- Ajoute : "Capteur de présence plafond HF"
- Ajoute : "Boîtier de commande DALI"

**Résultat :** Ces 3 accessoires apparaîtront sur la fiche produit "Highbay LED 100W".

---

### Méthode 2 : Via SQL (pour les liens en masse)

Si tu veux lier plusieurs accessoires rapidement, tu peux utiliser SQL :

```sql
-- Lier "Kit de suspension" au produit "Highbay LED 100W"
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
VALUES
(
  (SELECT id FROM public.products WHERE slug = 'highbay-led-100w'),  -- Produit principal
  (SELECT id FROM public.products WHERE slug = 'acc-kit-suspension-highbay'),  -- Accessoire
  0  -- Priorité (ordre d'affichage)
);
```

**⚠️ Attention :** Tu dois connaître les `slug` exacts des produits.

---

## 🎨 Étape 3 : Où les accessoires apparaissent sur le site

### 1. Sur la fiche produit (`/produit/[slug]`)

Quand un client regarde un produit, il voit une section **"Accessoires compatibles"** en bas de page.

**Exemple :**
- Page : `/produit/highbay-led-100w`
- Section : "Accessoires compatibles"
- Affiche : Les 3 accessoires que tu as liés

### 2. Sur la page catégorie (`/produits-solutions/[slug]`)

Quand un client regarde une catégorie, il voit une section **"Accessoires compatibles pour cette catégorie"**.

**Exemple :**
- Page : `/produits-solutions/highbay-led`
- Section : "Accessoires compatibles pour cette catégorie"
- Affiche : Tous les accessoires liés aux produits de cette catégorie (dédupliqués)

---

## 📊 Structure de la base de données

### Table `products`
Contient **tous les produits**, y compris les accessoires.

**Exemple :**
```
id: uuid-123
nom: "Kit de suspension pour Highbay"
categorie: "accessoires"
actif: true
prix: 39.90
```

### Table `product_accessories`
Table de **liaison** entre produits et accessoires.

**Exemple :**
```
product_id: uuid-456  (Highbay LED 100W)
accessory_id: uuid-123  (Kit de suspension)
priorite: 0  (ordre d'affichage)
```

**Règle :** Un accessoire peut être lié à plusieurs produits différents.

---

## ✅ Checklist : Mettre en place les accessoires

- [ ] **1. Exécuter le SQL** `20251204_insert_product_accessories.sql` dans Supabase
- [ ] **2. Vérifier** que les 20 accessoires apparaissent dans `/admin/products`
- [ ] **3. Pour chaque produit principal** (ex: Highbay, Projecteur, Borne) :
  - [ ] Aller sur `/produits/[id]/accessoires`
  - [ ] Ajouter 2-3 accessoires pertinents
- [ ] **4. Tester sur le site** :
  - [ ] Voir un produit → Vérifier la section "Accessoires compatibles"
  - [ ] Voir une catégorie → Vérifier la section "Accessoires pour cette catégorie"

---

## 🎯 Exemples concrets

### Exemple 1 : Highbay LED

**Produit principal :**
- "Highbay LED Effinor FR06 - 100W"

**Accessoires à lier :**
- "Kit de suspension pour Highbay"
- "Capteur de présence plafond HF"
- "Boîtier de commande DALI"
- "Kit de secours LED 1h"

**Résultat :** Sur la fiche "Highbay LED 100W", le client voit ces 4 accessoires.

---

### Exemple 2 : Borne de recharge maison

**Produit principal :**
- "Borne de recharge pour maison"

**Accessoires à lier :**
- "Câble de recharge Type 2 - 5m"
- "Support mural pour câble de recharge"
- "Kit de trappe / cache pour câblage"

**Résultat :** Sur la fiche "Borne de recharge maison", le client voit ces 3 accessoires.

---

## ❓ Questions fréquentes

### Q: Un accessoire peut-il être lié à plusieurs produits ?
**R:** Oui ! Par exemple, "Kit de suspension" peut être lié à tous les Highbay LED.

### Q: Les accessoires apparaissent-ils dans la liste des produits ?
**R:** Oui, ce sont des produits normaux. Ils apparaissent dans `/produits` et peuvent être achetés séparément.

### Q: Comment changer l'ordre d'affichage des accessoires ?
**R:** Le champ `priorite` dans `product_accessories` contrôle l'ordre. Plus le nombre est petit, plus l'accessoire apparaît en premier.

### Q: Puis-je désactiver un accessoire ?
**R:** Oui, mets `actif: false` sur le produit accessoire. Il ne s'affichera plus nulle part.

---

## 🚀 Prochaines étapes

1. **Exécute le SQL** pour créer les 20 accessoires
2. **Lie 2-3 accessoires** à un produit test (ex: Highbay LED)
3. **Vérifie sur le site** que ça fonctionne
4. **Continue** pour les autres produits

---

**Besoin d'aide ?** Vérifie que :
- La table `product_accessories` existe (migration `20251204_create_product_accessories_table.sql`)
- Les produits accessoires sont bien créés et `actif: true`
- Les liens sont bien créés dans `product_accessories`














