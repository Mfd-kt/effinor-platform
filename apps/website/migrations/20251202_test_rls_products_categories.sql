-- ============================================
-- Script de test RLS pour products et categories
-- ============================================
-- Ce script teste si les politiques RLS fonctionnent correctement
-- ============================================

-- IMPORTANT: Exécutez ce script en étant connecté avec votre compte super_admin
-- dans Supabase SQL Editor (pas en tant que service_role)

-- 1. Vérifier que vous êtes bien authentifié
SELECT 
  auth.uid() as "Current User ID",
  auth.email() as "Current User Email";

-- 2. Vérifier votre profil utilisateur
SELECT 
  u.id,
  u.email,
  u.role_slug,
  u.auth_user_id,
  CASE 
    WHEN u.auth_user_id = auth.uid() THEN '✅ Match'
    ELSE '❌ Pas de match'
  END as "Auth Match"
FROM public.utilisateurs u
WHERE u.auth_user_id = auth.uid()
LIMIT 1;

-- 3. Tester la lecture des produits (devrait fonctionner si vous êtes admin)
SELECT 
  COUNT(*) as "Nombre de produits accessibles"
FROM public.products;

-- 4. Tester la lecture des catégories (devrait fonctionner si vous êtes admin)
SELECT 
  COUNT(*) as "Nombre de catégories accessibles"
FROM public.categories;

-- 5. Vérifier les politiques RLS pour products
SELECT 
  policyname,
  cmd as "Command",
  CASE 
    WHEN qual LIKE '%utilisateurs%' AND qual LIKE '%role_slug%' THEN '✅ Utilise utilisateurs.role_slug'
    WHEN qual LIKE '%profiles%' THEN '❌ Utilise profiles (incorrect)'
    ELSE '⚠️ Vérifier manuellement'
  END as "Policy Check"
FROM pg_policies
WHERE tablename = 'products'
  AND schemaname = 'public'
ORDER BY policyname;

-- 6. Vérifier les politiques RLS pour categories
SELECT 
  policyname,
  cmd as "Command",
  CASE 
    WHEN qual LIKE '%utilisateurs%' AND qual LIKE '%role_slug%' THEN '✅ Utilise utilisateurs.role_slug'
    WHEN qual LIKE '%profiles%' THEN '❌ Utilise profiles (incorrect)'
    ELSE '⚠️ Vérifier manuellement'
  END as "Policy Check"
FROM pg_policies
WHERE tablename = 'categories'
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- Instructions:
-- ============================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez les résultats :
--    - "Current User ID" doit correspondre à votre auth_user_id
--    - "Auth Match" doit être "✅ Match"
--    - "Nombre de produits accessibles" doit être > 0 (si vous avez des produits)
--    - "Nombre de catégories accessibles" doit être > 0 (si vous avez des catégories)
--    - "Policy Check" doit être "✅ Utilise utilisateurs.role_slug" pour toutes les politiques
-- 3. Si "Nombre de produits accessibles" ou "Nombre de catégories accessibles" est 0,
--    cela signifie que les politiques RLS bloquent l'accès
-- ============================================



















