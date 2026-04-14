-- ============================================
-- Migration FINALE: Corriger les RLS policies pour categories et commandes
-- ============================================
-- Cette migration corrige les policies pour utiliser les fonctions helper
-- is_admin_user() et has_role() qui évitent la récursion infinie
-- 
-- IMPORTANT: Exécutez d'abord 20251202_fix_utilisateurs_rls_recursion.sql
-- pour créer les fonctions helper
-- ============================================

-- ============================================
-- PARTIE 1: CATEGORIES
-- ============================================

-- Activer RLS sur categories si ce n'est pas déjà fait
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les anciennes politiques pour categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Policy 1: Public peut voir les catégories (pour le site public)
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Admins peuvent insérer des catégories (utilise la fonction helper)
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 3: Admins peuvent modifier des catégories (utilise la fonction helper)
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer des catégories (utilise la fonction helper)
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 2: COMMANDES
-- ============================================

-- Activer RLS sur commandes si ce n'est pas déjà fait
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les anciennes politiques pour commandes
DROP POLICY IF EXISTS "Authenticated can create orders" ON public.commandes;
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.commandes;
DROP POLICY IF EXISTS "Users can view own orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can update orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.commandes;

-- Policy 1: Utilisateurs authentifiés peuvent créer des commandes
CREATE POLICY "Authenticated can create orders"
ON public.commandes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Utilisateurs authentifiés peuvent voir les commandes
-- (Les commerciaux verront uniquement leurs commandes assignées via le code frontend)
CREATE POLICY "Authenticated can view orders"
ON public.commandes
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins peuvent modifier les commandes (utilise la fonction helper)
CREATE POLICY "Admins can update orders"
ON public.commandes
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer les commandes (utilise la fonction helper)
CREATE POLICY "Admins can delete orders"
ON public.commandes
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 3: PRODUCTS (pour cohérence)
-- ============================================

-- Activer RLS sur products si ce n'est pas déjà fait
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les anciennes politiques pour products
DROP POLICY IF EXISTS "admin_full_access" ON public.products;
DROP POLICY IF EXISTS "allow_read_all" ON public.products;
DROP POLICY IF EXISTS "allow_write_authenticated" ON public.products;
DROP POLICY IF EXISTS "public_read_active" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Policy 1: Public peut voir les produits actifs (pour le site public)
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (actif = true);

-- Policy 2: Utilisateurs authentifiés peuvent voir tous les produits
CREATE POLICY "Authenticated can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins peuvent insérer des produits (utilise la fonction helper)
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent modifier des produits (utilise la fonction helper)
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 5: Admins peuvent supprimer des produits (utilise la fonction helper)
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifiez que :
-- 1. categories a exactement 4 politiques (1 SELECT + 3 INSERT/UPDATE/DELETE)
-- 2. commandes a exactement 4 politiques (1 INSERT + 1 SELECT + 2 UPDATE/DELETE)
-- 3. products a exactement 5 politiques (2 SELECT + 3 INSERT/UPDATE/DELETE)
-- 4. Toutes les politiques utilisent public.is_admin_user() pour éviter la récursion
-- ============================================

