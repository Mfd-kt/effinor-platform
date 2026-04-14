-- ============================================
-- Migration FINALE: Corriger les politiques RLS pour products et categories
-- ============================================
-- Cette migration supprime TOUTES les anciennes politiques et recrée les bonnes
-- en utilisant utilisateurs.auth_user_id et role_slug
-- ============================================

-- ============================================
-- PARTIE 1: PRODUCTS
-- ============================================

-- 1. Activer RLS sur products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes politiques pour products
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

-- 3. Créer les politiques correctes pour products

-- Policy 1: Public peut voir les produits actifs (pour le site public)
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (actif = true);

-- Policy 2: Utilisateurs authentifiés peuvent voir tous les produits
-- Cette politique permet à TOUS les utilisateurs authentifiés de voir les produits
-- (nécessaire pour que les admins puissent les voir)
CREATE POLICY "Authenticated can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins et super_admins peuvent insérer des produits
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

-- Policy 4: Admins et super_admins peuvent modifier des produits
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

-- Policy 5: Admins et super_admins peuvent supprimer des produits
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

-- ============================================
-- PARTIE 2: CATEGORIES
-- ============================================

-- 1. Activer RLS sur categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes politiques pour categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- 3. Créer les politiques correctes pour categories

-- Policy 1: Public peut voir les catégories (pour le site public)
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Admins et super_admins peuvent insérer des catégories
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

-- Policy 3: Admins et super_admins peuvent modifier des catégories
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

-- Policy 4: Admins et super_admins peuvent supprimer des catégories
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
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifiez que :
-- 1. products a exactement 5 politiques (2 SELECT + 3 INSERT/UPDATE/DELETE)
-- 2. categories a exactement 4 politiques (1 SELECT + 3 INSERT/UPDATE/DELETE)
-- 3. Toutes les politiques utilisent utilisateurs.auth_user_id et role_slug
-- ============================================



















