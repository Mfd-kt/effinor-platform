-- ============================================
-- Migration: Fix RLS policies for products and categories
-- ============================================
-- Problème: Les politiques RLS utilisent 'profiles.role' mais la table réelle est 'utilisateurs' avec 'role_slug'
-- Solution: Créer les bonnes politiques RLS en utilisant utilisateurs.auth_user_id et role_slug
-- ============================================

-- 1. Activer RLS sur les tables si ce n'est pas déjà fait
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent (au cas où)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- 3. Créer les politiques pour products

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

-- Policy 3: Admins et super_admins peuvent modifier les produits (INSERT, UPDATE, DELETE)
-- Note: On sépare INSERT, UPDATE, DELETE de SELECT pour éviter les conflits
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

-- 4. Créer les politiques pour categories

-- Policy 1: Public peut voir les catégories (pour le site public)
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Admins et super_admins peuvent modifier les catégories (INSERT, UPDATE, DELETE)
-- Note: On sépare INSERT, UPDATE, DELETE de SELECT pour éviter les conflits
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role_slug IN ('admin', 'super_admin')
  )
);

-- ============================================
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que les politiques ont été créées dans Table Editor > products/categories > Policies
-- ============================================

