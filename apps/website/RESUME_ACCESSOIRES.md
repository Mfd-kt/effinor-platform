# 🎯 Résumé : Système d'Accessoires (Version Simple)

## 📌 En 3 étapes

### ✅ Étape 1 : Créer les accessoires (DÉJÀ FAIT)
**Fichier :** `migrations/20251204_insert_product_accessories.sql`

**Action :** Exécuter ce SQL dans Supabase → SQL Editor

**Résultat :** 20 nouveaux produits accessoires dans ta base

---

### 🔗 Étape 2 : Lier les accessoires aux produits

**Option A : Via l'interface Admin (FACILE)** ⭐

1. Va sur `/admin/products` ou `/produits`
2. Trouve un produit (ex: "Highbay LED 100W")
3. Clique sur l'icône **🔌** (PlugZap) à droite
4. Tu arrives sur `/produits/[id]/accessoires`
5. Dans le menu déroulant, sélectionne un accessoire
6. Clique sur "Ajouter"
7. Répète pour chaque accessoire

**Option B : Via SQL (RAPIDE pour plusieurs produits)**

Exécute `migrations/20251204_link_accessories_example.sql` dans Supabase

**⚠️ Adapte les slugs** selon tes vrais produits avant d'exécuter !

---

### 🎨 Étape 3 : Vérifier sur le site

1. Va sur une fiche produit (ex: `/produit/highbay-led-100w`)
2. Scroll en bas → Section **"Accessoires compatibles"**
3. Tu devrais voir les accessoires que tu as liés

---

## 🔄 Schéma visuel

```
┌─────────────────────────────────────┐
│  TABLE: products                    │
│  ─────────────────────────────────  │
│  • Highbay LED 100W                 │
│  • Projecteur LED 50W               │
│  • Kit de suspension ← ACCESSOIRE  │
│  • Capteur présence ← ACCESSOIRE    │
│  • Câble Type 2 ← ACCESSOIRE        │
└─────────────────────────────────────┘
              │
              │ (via product_id)
              ▼
┌─────────────────────────────────────┐
│  TABLE: product_accessories          │
│  ─────────────────────────────────  │
│  product_id: Highbay LED             │
│  accessory_id: Kit suspension       │
│  priorite: 0                         │
│  ─────────────────────────────────  │
│  product_id: Highbay LED             │
│  accessory_id: Capteur présence     │
│  priorite: 1                         │
└─────────────────────────────────────┘
              │
              │ (affichage)
              ▼
┌─────────────────────────────────────┐
│  SITE WEB                            │
│  ─────────────────────────────────  │
│  Page: /produit/highbay-led-100w    │
│  ─────────────────────────────────  │
│  Section: "Accessoires compatibles"  │
│  • Kit de suspension                 │
│  • Capteur de présence               │
└─────────────────────────────────────┘
```

---

## 🎯 Exemple concret pas à pas

### Scénario : Lier des accessoires au "Highbay LED 100W"

**1. Trouve le produit dans l'admin**
- Va sur `/admin/products`
- Cherche "Highbay LED 100W"
- Note l'ID ou clique sur l'icône 🔌

**2. Ouvre la page accessoires**
- URL : `/produits/[id-du-produit]/accessoires`
- Tu vois : "Aucun accessoire n'est encore lié"

**3. Ajoute le premier accessoire**
- Menu déroulant : Sélectionne "Kit de suspension pour Highbay"
- Clique : "Ajouter"
- ✅ L'accessoire apparaît dans la liste

**4. Ajoute d'autres accessoires**
- Répète pour "Capteur de présence"
- Répète pour "Boîtier DALI"

**5. Vérifie sur le site**
- Va sur `/produit/highbay-led-100w`
- Scroll en bas
- ✅ Tu vois la section "Accessoires compatibles" avec tes 3 accessoires

---

## 📁 Fichiers importants

| Fichier | Rôle |
|---------|------|
| `migrations/20251204_insert_product_accessories.sql` | Crée les 20 produits accessoires |
| `migrations/20251204_create_product_accessories_table.sql` | Crée la table de liaison |
| `migrations/20251204_link_accessories_example.sql` | Exemples SQL pour lier automatiquement |
| `src/pages/admin/AdminProductAccessories.jsx` | Interface admin pour gérer les liens |
| `src/lib/api/products.js` | Fonctions `getAccessoriesForProduct()` et `getAccessoriesForCategory()` |
| `src/pages/ProductDetail.jsx` | Affiche les accessoires sur la fiche produit |
| `src/pages/CategoryDetail.jsx` | Affiche les accessoires sur la page catégorie |

---

## ❓ Questions rapides

**Q: Où sont les accessoires dans l'admin ?**
→ Dans `/admin/products`, ce sont des produits normaux avec `categorie: "accessoires"`

**Q: Comment lier un accessoire à plusieurs produits ?**
→ Répète l'étape 2 pour chaque produit, ou utilise le SQL en masse

**Q: Les accessoires apparaissent-ils dans la boutique ?**
→ Oui, ce sont des produits normaux, ils apparaissent dans `/produits`

**Q: Comment supprimer un lien ?**
→ Dans `/produits/[id]/accessoires`, clique sur l'icône poubelle 🗑️

---

## ✅ Checklist finale

- [ ] SQL `20251204_insert_product_accessories.sql` exécuté
- [ ] 20 accessoires visibles dans `/admin/products`
- [ ] Au moins 1 produit principal a des accessoires liés
- [ ] Section "Accessoires compatibles" visible sur une fiche produit
- [ ] Section "Accessoires pour cette catégorie" visible sur une page catégorie

---

**🎉 C'est tout ! Le système est simple : les accessoires sont des produits, et tu les lies via l'interface admin.**














