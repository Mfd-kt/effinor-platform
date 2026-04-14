-- ============================================
-- Migration: Corriger la récursion infinie dans les RLS policies de utilisateurs
-- ============================================
-- Problème: Les policies sur utilisateurs font référence à utilisateurs,
-- créant une récursion infinie.
-- Solution: Créer une fonction SECURITY DEFINER qui peut contourner RLS
-- ============================================

-- Fonction helper pour vérifier si l'utilisateur actuel est admin/super_admin
-- Cette fonction utilise SECURITY DEFINER pour contourner RLS
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

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.is_admin_user() IS 'Vérifie si l''utilisateur actuel est admin ou super_admin. Utilise SECURITY DEFINER pour contourner RLS.';

-- ============================================
-- PARTIE 1: Corriger les policies UTILISATEURS
-- ============================================

-- Supprimer toutes les anciennes policies sur utilisateurs
DROP POLICY IF EXISTS "Users can view own profile" ON public.utilisateurs;
DROP POLICY IF EXISTS "Admins can view all users" ON public.utilisateurs;
DROP POLICY IF EXISTS "Admins can update users" ON public.utilisateurs;
DROP POLICY IF EXISTS "Admins can insert users" ON public.utilisateurs;
DROP POLICY IF EXISTS "Admins can delete users" ON public.utilisateurs;

-- Policy 1: Utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON public.utilisateurs
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Policy 2: Admins peuvent voir tous les utilisateurs (utilise la fonction helper)
CREATE POLICY "Admins can view all users"
ON public.utilisateurs
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Policy 3: Admins peuvent modifier tous les utilisateurs
CREATE POLICY "Admins can update users"
ON public.utilisateurs
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent insérer des utilisateurs
CREATE POLICY "Admins can insert users"
ON public.utilisateurs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 5: Admins peuvent supprimer des utilisateurs
CREATE POLICY "Admins can delete users"
ON public.utilisateurs
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 2: Mettre à jour les autres policies pour utiliser la fonction helper
-- ============================================

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
-- VÉRIFICATION
-- ============================================
-- Les policies sur utilisateurs utilisent maintenant des fonctions SECURITY DEFINER
-- qui peuvent contourner RLS, évitant ainsi la récursion infinie
-- ============================================

