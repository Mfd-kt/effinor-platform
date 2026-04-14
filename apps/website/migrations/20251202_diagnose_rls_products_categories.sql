-- ============================================
-- Script de diagnostic RLS pour products et categories
-- ============================================
-- Ce script permet de vérifier l'état actuel des politiques RLS
-- ============================================

-- 1. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('products', 'categories')
  AND schemaname = 'public';

-- 2. Lister toutes les politiques existantes pour products
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
  AND schemaname = 'public'
ORDER BY policyname;

-- 3. Lister toutes les politiques existantes pour categories
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories'
  AND schemaname = 'public'
ORDER BY policyname;

-- 4. Vérifier la structure de la table utilisateurs
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'utilisateurs'
  AND column_name IN ('auth_user_id', 'role_slug', 'role')
ORDER BY ordinal_position;

-- 5. Test: Vérifier si un utilisateur admin peut voir les produits
-- Remplacez 'VOTRE_AUTH_USER_ID' par votre auth.uid() réel
-- Vous pouvez obtenir votre auth.uid() depuis Supabase Dashboard > Authentication > Users
SELECT 
  u.id,
  u.email,
  u.role_slug,
  u.auth_user_id,
  CASE 
    WHEN u.role_slug IN ('admin', 'super_admin') THEN 'OK - Admin'
    ELSE 'NOK - Pas admin'
  END as "Admin Status"
FROM public.utilisateurs u
WHERE u.auth_user_id IS NOT NULL
LIMIT 5;

-- ============================================
-- Instructions:
-- ============================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez les résultats :
--    - RLS doit être activé (RLS Enabled = true)
--    - Les politiques doivent exister pour products et categories
--    - La table utilisateurs doit avoir auth_user_id et role_slug
-- 3. Si des politiques manquent, exécutez 20251202_fix_rls_products_categories.sql
-- ============================================

