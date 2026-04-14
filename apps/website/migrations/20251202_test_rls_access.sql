-- ============================================
-- Script de test: Vérifier l'accès RLS pour categories et commandes
-- ============================================
-- Ce script teste si un utilisateur admin peut accéder aux tables
-- ============================================

-- Vérifier que les fonctions helper existent
SELECT 
  'Fonctions helper' AS test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_user' AND pronamespace = 'public'::regnamespace)
    THEN '✅ is_admin_user() existe'
    ELSE '❌ is_admin_user() N''EXISTE PAS'
  END AS status;

SELECT 
  'Fonctions helper' AS test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace)
    THEN '✅ has_role() existe'
    ELSE '❌ has_role() N''EXISTE PAS'
  END AS status;

-- Vérifier les policies sur categories
SELECT 
  'CATEGORIES Policies' AS test,
  COUNT(*) AS nombre_policies,
  STRING_AGG(policyname, ', ') AS policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'categories';

-- Vérifier les policies sur commandes
SELECT 
  'COMMANDES Policies' AS test,
  COUNT(*) AS nombre_policies,
  STRING_AGG(policyname, ', ') AS policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'commandes';

-- Vérifier si RLS est activé
SELECT 
  'RLS Status' AS test,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END AS status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'commandes', 'products')
ORDER BY tablename;

-- Tester l'accès SELECT sur categories (simuler un utilisateur admin)
-- Note: Ce test nécessite d'être connecté en tant qu'utilisateur admin
-- Pour tester manuellement, exécutez ces requêtes dans Supabase SQL Editor
-- en étant connecté avec un compte admin

-- Test 1: Vérifier si on peut SELECT sur categories
-- (À exécuter manuellement avec un compte admin connecté)
-- SELECT COUNT(*) FROM public.categories;

-- Test 2: Vérifier si on peut SELECT sur commandes
-- (À exécuter manuellement avec un compte admin connecté)
-- SELECT COUNT(*) FROM public.commandes;

-- Vérifier les policies qui utilisent encore role_slug (qui n'existe plus)
SELECT 
  '⚠️ POLICIES AVEC role_slug (À CORRIGER)' AS warning,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE (qual::text LIKE '%role_slug%' OR with_check::text LIKE '%role_slug%')
  AND schemaname = 'public'
  AND tablename IN ('categories', 'commandes', 'products')
ORDER BY tablename, policyname;

-- Vérifier les policies qui utilisent encore utilisateurs.role (qui n'existe plus)
SELECT 
  '⚠️ POLICIES AVEC utilisateurs.role (À CORRIGER)' AS warning,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE (qual::text LIKE '%utilisateurs.role%' OR with_check::text LIKE '%utilisateurs.role%')
  AND schemaname = 'public'
  AND tablename IN ('categories', 'commandes', 'products')
ORDER BY tablename, policyname;

-- Vérifier si les policies utilisent les fonctions helper
SELECT 
  '✅ POLICIES UTILISANT is_admin_user()' AS status,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE (qual::text LIKE '%is_admin_user()%' OR with_check::text LIKE '%is_admin_user()%')
  AND schemaname = 'public'
  AND tablename IN ('categories', 'commandes', 'products')
ORDER BY tablename, policyname;



















