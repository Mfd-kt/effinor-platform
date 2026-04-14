# 🎨 Système de Couleurs - ECPS/Effinor

## Palette de Couleurs Identifiée depuis l'Image

### Vert Principal (Brand Color) 🟢
**Couleur identifiée** : Vert émeraude/teal vif  
**Code hex** : `#10B981` (actuellement utilisé)  
**Usage** :
- Logo EFFINOR
- Boutons principaux (CTA)
- Bouton flottant téléphone
- Liens actifs dans la navigation
- Bouton "Appelez-nous"
- Badges "Prime CEE"
- Statistiques (nombres)

**Variables CSS actuelles** :
```css
--secondary-500: #10B981;  /* Principal */
--secondary-600: #059669;  /* Hover */
--secondary-400: #34D399;  /* Lighter */
--secondary-700: #047857;  /* Darker */
```

### Fond Sombre Hero (Dark Teal/Blue) 🔵
**Couleur identifiée** : Bleu marine très sombre  
**Code hex** : `#0F172A` à `#1E293B` (actuellement utilisé)  
**Usage** :
- Section hero gauche (fond)
- Texte blanc sur fond sombre
- Footer

**Variables CSS actuelles** :
```css
--primary-900: #0F172A;  /* Le plus sombre */
--primary-800: #1E293B;
--primary-700: #334155;
```

### Blanc ⚪
**Code hex** : `#FFFFFF`  
**Usage** :
- Cartes de formulaire
- Fond navigation
- Texte sur fond sombre
- Bouton secondaire

### Gris (Neutral) ⚫
**Codes hex** : Palette gris standard  
**Usage** :
- Bannière promotionnelle (gris foncé)
- Navigation (gris clair)
- Cartes statistiques (gris foncé avec bordure)
- Texte secondaire

**Variables CSS actuelles** :
```css
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
...
--gray-800: #1F2937;
--gray-900: #111827;
```

### Jaune/Or (Accent) 🟡
**Code hex** : `#FFBA0B` (détecté dans certains fichiers)  
**Usage** :
- Badges spéciaux
- Éléments d'accentuation

**Note** : Cette couleur n'est pas dans le système actuel mais utilisée dans certains fichiers.

---

## ✅ Actions Requises pour Harmonisation

### 1. **Remplacer les couleurs codées en dur**

Fichiers avec couleurs codées en dur à corriger :

#### `src/pages/admin/AdminUserForm.jsx`
- ❌ `bg-[#116BAD]` → ✅ `bg-secondary-600` ou `var(--secondary-600)`
- ❌ `hover:bg-[#0E4C8A]` → ✅ `hover:bg-secondary-700`

#### `src/pages/admin/AdminLeadDetail.jsx`
- ❌ `bg-[#0E4C8A]` → ✅ `bg-secondary-700`
- ❌ `hover:bg-[#0b3a6d]` → ✅ `hover:bg-secondary-800`
- ❌ `text-[#116BAD]` → ✅ `text-secondary-600`

#### `src/pages/Shop.jsx`
- ❌ `bg-[#116BAD]` → ✅ `bg-secondary-600`
- ❌ `text-[#116BAD]` → ✅ `text-secondary-600`
- ❌ `bg-[#FFBA0B]` → ✅ Ajouter à la palette ou utiliser `bg-accent-400`

#### `src/pages/About.jsx`
- ❌ `bg-[#116BAD]` → ✅ `bg-secondary-600`
- ❌ `bg-[#FFBA0B]` → ✅ Ajouter à la palette

### 2. **Mettre à jour Tailwind Config**

Ajouter les couleurs personnalisées dans `tailwind.config.js` pour qu'elles soient disponibles partout :

```javascript
colors: {
  // ... couleurs existantes
  'effinor': {
    'green': {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',  // Principal
      600: '#059669',  // Hover
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    'dark': {
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    }
  }
}
```

### 3. **Standardiser l'utilisation**

- ✅ Utiliser toujours `var(--secondary-500)` ou `bg-secondary-600` (Tailwind)
- ✅ Utiliser les classes Tailwind quand possible
- ❌ Éviter les couleurs codées en dur (`#116BAD`, etc.)

---

## 📋 Checklist d'Harmonisation

- [ ] Remplacer `#116BAD` par `var(--secondary-600)` ou `bg-secondary-600`
- [ ] Remplacer `#0E4C8A` par `var(--secondary-700)` ou `bg-secondary-700`
- [ ] Remplacer `#FFBA0B` par une variable d'accent ou la supprimer
- [ ] Vérifier tous les fichiers admin pour cohérence
- [ ] Vérifier tous les fichiers pages pour cohérence
- [ ] Vérifier tous les composants pour cohérence
- [ ] Mettre à jour `tailwind.config.js` avec couleurs personnalisées
- [ ] Tester l'apparence sur toutes les pages

---

**Objectif** : Tous les éléments utilisent les mêmes codes couleur via les variables CSS ou classes Tailwind, garantissant une cohérence visuelle parfaite.
