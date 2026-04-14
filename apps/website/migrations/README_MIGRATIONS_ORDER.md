# Ordre d'exécution des migrations RLS

## ⚠️ IMPORTANT : Exécutez les migrations dans cet ordre exact

### 1. Diagnostic (optionnel mais recommandé)
```sql
-- Exécutez d'abord pour voir l'état actuel
migrations/20251202_diagnostic_rls_policies.sql
```

### 2. Corriger la récursion infinie (OBLIGATOIRE EN PREMIER)
```sql
-- Crée les fonctions helper is_admin_user() et has_role()
-- Ces fonctions sont nécessaires pour toutes les autres migrations
migrations/20251202_fix_utilisateurs_rls_recursion.sql
```

### 3. Nettoyer les colonnes redondantes (si pas déjà fait)
```sql
-- Supprime les colonnes role et role_slug de utilisateurs
-- Utilise uniquement role_id (FK vers roles)
migrations/20251202_clean_utilisateurs_role_columns.sql
```

### 4. Corriger categories et commandes (POUR RÉSOUDRE VOTRE PROBLÈME)
```sql
-- Corrige les RLS policies pour categories, commandes et products
-- Utilise les fonctions helper créées à l'étape 2
migrations/20251202_fix_categories_commandes_rls_final.sql
```

### 5. Mettre à jour les autres policies (optionnel)
```sql
-- Met à jour les policies pour notifications, products, categories
-- Utilise les fonctions helper
migrations/20251202_update_rls_policies_use_role_relation.sql
```

### 6. Ajouter les policies manquantes (optionnel)
```sql
-- Ajoute les RLS policies pour toutes les autres tables
-- Utilise les fonctions helper
migrations/20251202_add_missing_rls_policies_for_all_tables.sql
```

## 🔧 Solution rapide pour votre problème actuel

Si vous ne pouvez pas accéder à **Categories** et **Commandes**, exécutez dans cet ordre :

1. **20251202_fix_utilisateurs_rls_recursion.sql** (crée les fonctions helper)
2. **20251202_fix_categories_commandes_rls_final.sql** (corrige les policies)

## ✅ Vérification après exécution

Exécutez le script de diagnostic pour vérifier :
```sql
migrations/20251202_diagnostic_rls_policies.sql
```

Vous devriez voir :
- ✅ Fonction is_admin_user() existe
- ✅ Fonction has_role() existe
- ✅ Policies sur categories utilisent `public.is_admin_user()`
- ✅ Policies sur commandes utilisent `public.is_admin_user()`
- ✅ Aucune policy n'utilise `role_slug` ou `utilisateurs.role`

## 🐛 Problèmes courants

### Erreur : "function is_admin_user() does not exist"
**Solution** : Exécutez d'abord `20251202_fix_utilisateurs_rls_recursion.sql`

### Erreur : "column role_slug does not exist"
**Solution** : Les policies utilisent encore l'ancienne colonne. Exécutez `20251202_fix_categories_commandes_rls_final.sql` pour les corriger.

### Erreur : "infinite recursion detected"
**Solution** : Les fonctions helper n'existent pas ou les policies ne les utilisent pas. Vérifiez avec le script de diagnostic.



















