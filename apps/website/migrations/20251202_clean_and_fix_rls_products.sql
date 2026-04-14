-- ============================================
-- Migration: Nettoyer et corriger toutes les politiques RLS pour products
-- ============================================
-- Problème: Il y a plusieurs politiques en conflit, certaines utilisent peut-être 'profiles'
-- Solution: Supprimer toutes les anciennes politiques et recréer les bonnes
-- ============================================

-- 1. Activer RLS sur la table si ce n'est pas déjà fait
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes politiques pour products
-- (Cela garantit qu'il n'y a pas de conflits)
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
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que les politiques ont été créées dans Table Editor > products > Policies
--    Vous devriez voir exactement 5 politiques :
--    - Public can view active products (SELECT, anon, authenticated)
--    - Authenticated can view all products (SELECT, authenticated)
--    - Admins can insert products (INSERT, authenticated)
--    - Admins can update products (UPDATE, authenticated)
--    - Admins can delete products (DELETE, authenticated)
-- ============================================



















