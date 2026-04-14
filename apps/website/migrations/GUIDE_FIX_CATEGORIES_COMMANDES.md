# 🔧 Guide de résolution : Accès à Categories et Commandes

## Problème
Vous ne pouvez pas accéder aux pages `/categories` et `/commandes` malgré les migrations.

## Solution rapide (1 migration)

Exécutez **UNE SEULE** migration qui corrige tout :

```sql
migrations/20251202_fix_all_rls_complete.sql
```

Cette migration :
- ✅ Crée les fonctions helper `is_admin_user()` et `has_role()`
- ✅ Supprime toutes les anciennes policies sur categories, commandes, products
- ✅ Crée les nouvelles policies utilisant les fonctions helper
- ✅ Vérifie que tout est correctement configuré

## Vérification après exécution

### 1. Vérifier que les fonctions existent
```sql
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('is_admin_user', 'has_role');
```

Vous devriez voir :
- `is_admin_user`
- `has_role`

### 2. Vérifier les policies
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('categories', 'commandes')
ORDER BY tablename, policyname;
```

**Pour categories**, vous devriez voir 4 policies :
- `Public can view categories` (SELECT)
- `Admins can insert categories` (INSERT)
- `Admins can update categories` (UPDATE)
- `Admins can delete categories` (DELETE)

**Pour commandes**, vous devriez voir 4 policies :
- `Authenticated can create orders` (INSERT)
- `Authenticated can view orders` (SELECT)
- `Admins can update orders` (UPDATE)
- `Admins can delete orders` (DELETE)

### 3. Tester l'accès (en étant connecté avec un compte admin)
```sql
-- Test categories
SELECT COUNT(*) FROM public.categories;

-- Test commandes
SELECT COUNT(*) FROM public.commandes;
```

Si ces requêtes fonctionnent, les RLS policies sont correctes.

## Si ça ne fonctionne toujours pas

### Étape 1 : Vérifier votre rôle
```sql
SELECT 
  u.id,
  u.email,
  r.slug AS role_slug,
  r.nom AS role_nom
FROM public.utilisateurs u
INNER JOIN public.roles r ON r.id = u.role_id
WHERE u.auth_user_id = auth.uid();
```

Vous devez avoir `role_slug = 'admin'` ou `'super_admin'` pour accéder à `/categories`.

### Étape 2 : Vérifier les erreurs dans la console du navigateur
Ouvrez la console (F12) et regardez les erreurs :
- Si vous voyez `400 Bad Request` → Problème RLS
- Si vous voyez `403 Forbidden` → Problème de permissions
- Si vous voyez `function is_admin_user() does not exist` → Les fonctions helper n'existent pas

### Étape 3 : Exécuter le script de diagnostic
```sql
migrations/20251202_test_rls_access.sql
```

Ce script vous dira exactement ce qui ne va pas.

## Ordre d'exécution complet (si vous voulez tout refaire)

Si vous voulez repartir de zéro, exécutez dans cet ordre :

1. **20251202_fix_all_rls_complete.sql** (tout-en-un, corrige tout)
2. **20251202_add_missing_columns.sql** (ajoute les colonnes manquantes)

C'est tout ! Les autres migrations sont optionnelles.

## Problèmes courants

### ❌ "function is_admin_user() does not exist"
**Cause** : Les fonctions helper n'ont pas été créées.
**Solution** : Exécutez `20251202_fix_all_rls_complete.sql`

### ❌ "infinite recursion detected"
**Cause** : Les policies utilisent encore des requêtes directes sur `utilisateurs`.
**Solution** : Exécutez `20251202_fix_all_rls_complete.sql` qui utilise les fonctions helper.

### ❌ "column role_slug does not exist"
**Cause** : Les policies utilisent encore l'ancienne colonne supprimée.
**Solution** : Exécutez `20251202_fix_all_rls_complete.sql` qui supprime toutes les anciennes policies.

### ❌ Accès refusé dans le frontend mais pas en SQL
**Cause** : Problème de permissions frontend (RequireRole).
**Solution** : Vérifiez que votre utilisateur a bien le rôle `admin` ou `super_admin` dans la table `utilisateurs`.

## Support

Si après avoir exécuté `20251202_fix_all_rls_complete.sql` et vérifié avec le script de diagnostic, vous n'avez toujours pas accès, envoyez-moi :
1. Le résultat du script de diagnostic
2. Les erreurs de la console du navigateur
3. Votre rôle utilisateur (résultat de la requête de l'étape 1)


