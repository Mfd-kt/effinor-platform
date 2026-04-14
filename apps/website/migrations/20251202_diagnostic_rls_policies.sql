-- ============================================
-- Script de diagnostic: Vérifier l'état des RLS policies
-- ============================================
-- Ce script permet de vérifier quelles policies existent et comment elles sont configurées
-- ============================================

-- Vérifier si les fonctions helper existent
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_user' AND pronamespace = 'public'::regnamespace)
    THEN '✅ Fonction is_admin_user() existe'
    ELSE '❌ Fonction is_admin_user() N''EXISTE PAS - Exécutez 20251202_fix_utilisateurs_rls_recursion.sql'
  END AS status_fonction_admin;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace)
    THEN '✅ Fonction has_role() existe'
    ELSE '❌ Fonction has_role() N''EXISTE PAS - Exécutez 20251202_fix_utilisateurs_rls_recursion.sql'
  END AS status_fonction_role;

-- Vérifier les policies sur categories
SELECT 
  'CATEGORIES' AS table_name,
  policyname,
  cmd,
  qual::text AS using_clause,
  with_check::text AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'categories'
ORDER BY policyname;

-- Vérifier les policies sur commandes
SELECT 
  'COMMANDES' AS table_name,
  policyname,
  cmd,
  qual::text AS using_clause,
  with_check::text AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'commandes'
ORDER BY policyname;

-- Vérifier les policies sur products
SELECT 
  'PRODUCTS' AS table_name,
  policyname,
  cmd,
  qual::text AS using_clause,
  with_check::text AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY policyname;

-- Vérifier si des policies utilisent encore role_slug (qui n'existe plus)
SELECT 
  'POLICIES AVEC role_slug (À CORRIGER)' AS warning,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE (qual::text LIKE '%role_slug%' OR with_check::text LIKE '%role_slug%')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Vérifier si des policies utilisent encore utilisateurs.role (qui n'existe plus)
SELECT 
  'POLICIES AVEC utilisateurs.role (À CORRIGER)' AS warning,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE (qual::text LIKE '%utilisateurs.role%' OR with_check::text LIKE '%utilisateurs.role%')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Vérifier si RLS est activé sur les tables
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END AS rls_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'commandes', 'products', 'utilisateurs', 'leads')
ORDER BY tablename;



















