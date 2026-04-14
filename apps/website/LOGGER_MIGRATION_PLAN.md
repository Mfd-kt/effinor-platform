# 📋 Plan de Migration - Remplacement console.* par logger

**Total fichiers à modifier** : 21 fichiers  
**Total occurrences** : 96 (excluant logger.js qui utilise console.* dans son implémentation)

---

## ✅ PRIORITÉ 1 : src/utils/ (2 fichiers)

### 1. `src/utils/formStorage.js`
- **Occurrences** : 3 `console.error`
  - Ligne 16: Error saving form data
  - Ligne 33: Error loading form data  
  - Ligne 50: Error clearing form data
- **Action** : Remplacer par `logger.error`

### 2. `src/utils/formUtils.js`
- **Occurrences** : 1 `console.error`
  - Ligne 45: Error submitting form to Supabase
- **Action** : Remplacer par `logger.error`

---

## ✅ PRIORITÉ 2 : src/components/ (1 fichier)

### 3. `src/components/ProductCard.jsx`
- **Occurrences** : 1 `console.log`
  - Ligne 16: Requesting quote for product
- **Action** : Remplacer par `logger.log`

---

## ✅ PRIORITÉ 3 : src/pages/ (14 fichiers)

### 4. `src/pages/admin/AdminProducts.jsx`
- **Occurrences** : 9 `console.log` + 1 `console.error`
  - Lignes 112, 124, 136, 158, 163, 168, 190, 202: console.log
  - Ligne 129: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

### 5. `src/pages/admin/AdminUserForm.jsx`
- **Occurrences** : 7 `console.log` + 2 `console.error`
  - Lignes 108, 109, 117, 131, 147, 151: console.log (debug création profil)
  - Lignes 57, 155: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

### 6. `src/pages/admin/AdminVisitors.jsx`
- **Occurrences** : 2 `console.error`
  - Ligne 25: Error fetching visitors
  - Ligne 50: Failed to subscribe
- **Action** : Remplacer par `logger.error`

### 7. `src/pages/admin/AdminUsers.jsx`
- **Occurrences** : 2 `console.log` + 2 `console.error`
  - Lignes 23, 34: console.log
  - Lignes 37, 67: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

### 8. `src/pages/admin/AdminLogin.jsx`
- **Occurrences** : 1 `console.log` + 1 `console.error`
  - Ligne 98: Login successful (avec données sensibles !)
  - Ligne 31: Login Error
- **Action** : Remplacer log → logger.log, error → logger.error
- **⚠️ Attention** : Ligne 98 expose des données utilisateur, considérer logger.info en dev seulement

### 9. `src/pages/admin/AdminProductForm.jsx`
- **Occurrences** : 18 `console.log` + 2 `console.error` + 2 `console.warn`
  - Nombreux logs de debug (upload fichiers, sauvegarde produit)
  - Lignes 229, 241, 294, 351: console.error
  - Lignes 202, 269: console.warn
- **Action** : Remplacer log → logger.log, error → logger.error, warn → logger.warn

### 10. `src/pages/admin/AdminDashboard.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 89: Error fetching dashboard data
- **Action** : Remplacer par `logger.error`

### 11. `src/pages/admin/AdminLeadDetail.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 191: addNote error
- **Action** : Remplacer par `logger.error`

### 12. `src/pages/Boutique.jsx`
- **Occurrences** : 6 `console.log` + 1 `console.error`
  - Lignes 26, 37, 54, 59, 63, 67, 102: console.log (debug chargement produits)
  - Ligne 46: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

### 13. `src/pages/Cart.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 76: Error submitting order
- **Action** : Remplacer par `logger.error`

### 14. `src/pages/CEEEligibilityForm.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 156: Error updating lead
- **Action** : Remplacer par `logger.error`

### 15. `src/pages/Contact.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 82: Error submitting form
- **Action** : Remplacer par `logger.error`

### 16. `src/pages/LoginDirect.jsx`
- **Occurrences** : 4 `console.log` + 2 `console.error`
  - Lignes 14, 42, 65, 79: console.log (debug info)
  - Lignes 25, 74, 101: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

### 17. `src/pages/ProductDetail.jsx`
- **Occurrences** : 2 `console.log` + 1 `console.error`
  - Lignes 58, 77: console.log
  - Ligne 81: console.error
- **Action** : Remplacer log → logger.log, error → logger.error

---

## ✅ PRIORITÉ 4 : src/contexts/ (1 fichier)

### 18. `src/contexts/CartContext.jsx`
- **Occurrences** : 1 `console.error`
  - Ligne 23: Could not parse cart from localStorage
- **Action** : Remplacer par `logger.error`

---

## ✅ PRIORITÉ 5 : src/hooks/ (2 fichiers)

### 19. `src/hooks/useLocalStorage.js`
- **Occurrences** : 2 `console.error`
  - Ligne 10: Error parsing JSON
  - Ligne 26: Error setting item
- **Action** : Remplacer par `logger.error`

### 20. `src/hooks/useVisitorTracking.js`
- **Occurrences** : 3 `console.error`
  - Ligne 22: Could not fetch IP address
  - Ligne 47: Error starting visitor session
  - Ligne 69: Error updating visitor session
- **Action** : Remplacer par `logger.error`

---

## 📊 Résumé par Type

- **console.log** → `logger.log` : ~50 occurrences
- **console.error** → `logger.error` : ~40 occurrences  
- **console.warn** → `logger.warn` : 2 occurrences
- **console.info** : 0 occurrences
- **console.debug** : 0 occurrences

---

## 🔍 Fichiers Exclus

- `src/utils/logger.js` : Contient console.* dans son implémentation (normal)

---

## ⚠️ Points d'Attention

1. **AdminLogin.jsx ligne 98** : Log avec données utilisateur (email, nom). Considérer logger.info pour éviter l'exposition en production.

2. **AdminUserForm.jsx lignes 108-151** : Bloc de debug avec données sensibles. Ces logs devraient être logger.debug ou supprimés.

3. **AdminProductForm.jsx** : Nombreux logs de debug avec emojis. À conserver en dev seulement (logger.log convient).

4. **LoginDirect.jsx** : Page de debug/test avec beaucoup de logs. Considérer logger.debug pour ces cas.

---

## ✅ Checklist de Migration

Pour chaque fichier :
- [ ] Ajouter import : `import { logger } from '@/utils/logger'`
- [ ] Remplacer `console.log` → `logger.log`
- [ ] Remplacer `console.error` → `logger.error`
- [ ] Remplacer `console.warn` → `logger.warn`
- [ ] Remplacer `console.info` → `logger.info`
- [ ] Vérifier qu'aucun console.* ne reste
- [ ] Tester que le fichier compile

---

**Prêt à procéder ?** 🚀
