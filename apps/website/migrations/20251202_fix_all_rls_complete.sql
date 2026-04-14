-- ============================================
-- Migration COMPLÈTE: Corriger TOUTES les RLS policies
-- ============================================
-- Cette migration vérifie et corrige toutes les RLS policies en une seule fois
-- Elle peut être exécutée plusieurs fois sans problème (idempotente)
-- ============================================

-- ============================================
-- ÉTAPE 1: Créer les fonctions helper (si elles n'existent pas)
-- ============================================

-- Fonction helper pour vérifier si l'utilisateur actuel est admin/super_admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.utilisateurs u
    INNER JOIN public.roles r ON r.id = u.role_id
    WHERE u.auth_user_id = auth.uid()
    AND r.slug IN ('admin', 'super_admin')
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_user() IS 'Vérifie si l''utilisateur actuel est admin ou super_admin. Utilise SECURITY DEFINER pour contourner RLS.';

-- Fonction helper pour vérifier si l'utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_role(role_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.utilisateurs u
    INNER JOIN public.roles r ON r.id = u.role_id
    WHERE u.auth_user_id = auth.uid()
    AND r.slug = role_slug
  );
END;
$$;

COMMENT ON FUNCTION public.has_role(TEXT) IS 'Vérifie si l''utilisateur actuel a le rôle spécifié. Utilise SECURITY DEFINER pour contourner RLS.';

-- ============================================
-- ÉTAPE 2: CATEGORIES - Supprimer toutes les anciennes policies
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- ============================================
-- ÉTAPE 3: CATEGORIES - Créer les nouvelles policies
-- ============================================

-- Policy 1: Public peut voir les catégories
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Admins peuvent insérer des catégories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 3: Admins peuvent modifier des catégories
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer des catégories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- ÉTAPE 4: COMMANDES - Supprimer toutes les anciennes policies
-- ============================================

ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can create orders" ON public.commandes;
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.commandes;
DROP POLICY IF EXISTS "Users can view own orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can update orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.commandes;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.commandes;

-- ============================================
-- ÉTAPE 5: COMMANDES - Créer les nouvelles policies
-- ============================================

-- Policy 1: Utilisateurs authentifiés peuvent créer des commandes
CREATE POLICY "Authenticated can create orders"
ON public.commandes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Utilisateurs authentifiés peuvent voir les commandes
CREATE POLICY "Authenticated can view orders"
ON public.commandes
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins peuvent modifier les commandes
CREATE POLICY "Admins can update orders"
ON public.commandes
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer les commandes
CREATE POLICY "Admins can delete orders"
ON public.commandes
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- ÉTAPE 6: PRODUCTS - Supprimer toutes les anciennes policies
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- ÉTAPE 7: PRODUCTS - Créer les nouvelles policies
-- ============================================

-- Policy 1: Public peut voir les produits actifs
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

-- Policy 3: Admins peuvent insérer des produits
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent modifier des produits
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 5: Admins peuvent supprimer des produits
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Afficher le nombre de policies créées
DO $$
DECLARE
  cat_count INTEGER;
  cmd_count INTEGER;
  prod_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories';
  SELECT COUNT(*) INTO cmd_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'commandes';
  SELECT COUNT(*) INTO prod_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products';
  
  RAISE NOTICE '✅ Policies créées:';
  RAISE NOTICE '   - categories: % policies', cat_count;
  RAISE NOTICE '   - commandes: % policies', cmd_count;
  RAISE NOTICE '   - products: % policies', prod_count;
  
  IF cat_count = 4 AND cmd_count = 4 AND prod_count = 5 THEN
    RAISE NOTICE '✅ Toutes les policies sont correctement configurées!';
  ELSE
    RAISE WARNING '⚠️  Nombre de policies inattendu. Vérifiez manuellement.';
  END IF;
END $$;

-- ============================================
-- RÉSUMÉ
-- ============================================
-- Cette migration a :
-- 1. Créé les fonctions helper is_admin_user() et has_role()
-- 2. Supprimé toutes les anciennes policies sur categories, commandes, products
-- 3. Créé les nouvelles policies utilisant les fonctions helper
-- 4. Vérifié que toutes les policies sont en place
-- 
-- Après cette migration, vous devriez pouvoir accéder à :
-- - /categories (pour admin/super_admin)
-- - /commandes (pour tous les utilisateurs authentifiés)
-- ============================================



















