-- ============================================
-- Test direct des politiques RLS pour products et categories
-- ============================================
-- IMPORTANT: Exécutez ce script en étant connecté avec votre compte super_admin
-- dans Supabase SQL Editor (pas en tant que service_role)
-- ============================================

-- 1. Vérifier votre identité actuelle
SELECT 
  auth.uid() as "Votre User ID",
  auth.email() as "Votre Email";

-- 2. Vérifier votre profil dans utilisateurs
SELECT 
  u.id,
  u.email,
  u.role_slug,
  u.auth_user_id,
  CASE 
    WHEN u.auth_user_id = auth.uid() THEN '✅ Match - Vous êtes bien identifié'
    ELSE '❌ Pas de match - Problème d identification'
  END as "Statut"
FROM public.utilisateurs u
WHERE u.auth_user_id = auth.uid()
LIMIT 1;

-- 3. Test SELECT sur products (devrait fonctionner si vous êtes admin)
-- Si cette requête retourne 0 lignes, les politiques RLS bloquent
SELECT 
  COUNT(*) as "Nombre de produits accessibles",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Accès autorisé'
    ELSE '❌ Accès bloqué par RLS'
  END as "Statut RLS"
FROM public.products;

-- 4. Test SELECT sur categories (devrait fonctionner si vous êtes admin)
-- Si cette requête retourne 0 lignes, les politiques RLS bloquent
SELECT 
  COUNT(*) as "Nombre de catégories accessibles",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Accès autorisé'
    ELSE '❌ Accès bloqué par RLS'
  END as "Statut RLS"
FROM public.categories;

-- 5. Vérifier les politiques RLS pour products
SELECT 
  policyname,
  cmd,
  roles::text as "Applied To",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'products'
  AND schemaname = 'public'
ORDER BY policyname;

-- 6. Vérifier les politiques RLS pour categories
SELECT 
  policyname,
  cmd,
  roles::text as "Applied To",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'categories'
  AND schemaname = 'public'
ORDER BY policyname;

-- 7. Test de la condition RLS manuellement
-- Cette requête simule ce que fait la politique RLS
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.utilisateurs
      WHERE utilisateurs.auth_user_id = auth.uid()
      AND utilisateurs.role_slug IN ('admin', 'super_admin')
    ) THEN '✅ Vous êtes reconnu comme admin'
    ELSE '❌ Vous n êtes pas reconnu comme admin'
  END as "Vérification Admin";

-- ============================================
-- Instructions:
-- ============================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez les résultats :
--    - "Votre User ID" doit correspondre à votre auth_user_id
--    - "Statut" doit être "✅ Match"
--    - "Nombre de produits accessibles" doit être > 0 (si vous avez des produits)
--    - "Nombre de catégories accessibles" doit être > 0 (si vous avez des catégories)
--    - "Statut RLS" doit être "✅ Accès autorisé"
--    - "Vérification Admin" doit être "✅ Vous êtes reconnu comme admin"
-- 3. Si "Statut RLS" est "❌ Accès bloqué par RLS", les politiques ne fonctionnent pas
-- 4. Si "Vérification Admin" est "❌", la condition dans les politiques ne vous reconnaît pas
-- ============================================



















