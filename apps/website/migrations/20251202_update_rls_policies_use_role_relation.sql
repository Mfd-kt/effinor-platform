-- ============================================
-- Migration: Mise à jour des RLS policies pour utiliser la relation roles via role_id
-- ============================================
-- Cette migration met à jour toutes les RLS policies qui utilisent
-- utilisateurs.role ou utilisateurs.role_slug pour utiliser la relation
-- roles via utilisateurs.role_id
-- 
-- IMPORTANT: Exécutez d'abord 20251202_fix_utilisateurs_rls_recursion.sql
-- pour créer les fonctions helper is_admin_user() et has_role()
-- ============================================

-- ============================================
-- PARTIE 1: Mise à jour des policies NOTIFICATIONS
-- ============================================

-- Policy 1: Admin voit toutes les notifications (utilise la fonction helper)
DROP POLICY IF EXISTS admin_all_notifications ON public.notifications;
CREATE POLICY admin_all_notifications
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Policy 2: Manager voit toutes les notifications (utilise la fonction helper)
DROP POLICY IF EXISTS manager_all_notifications ON public.notifications;
CREATE POLICY manager_all_notifications
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role('manager'));

-- Policy 3: Super Admin voit toutes les notifications (utilise la fonction helper)
DROP POLICY IF EXISTS super_admin_all_notifications ON public.notifications;
CREATE POLICY super_admin_all_notifications
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role('super_admin'));

-- Policy 4: Utilisateur voit ses propres notifications + globales + celles de son rôle
DROP POLICY IF EXISTS user_notifications ON public.notifications;
CREATE POLICY user_notifications
ON public.notifications
FOR SELECT
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR (
    recipient_role IS NOT NULL 
    AND public.has_role(recipient_role)
  )
  OR (recipient_user_id IS NULL AND recipient_role IS NULL)  -- notification globale
);

-- Policy 5: Utilisateur peut mettre à jour ses propres notifications (marquer comme lu)
DROP POLICY IF EXISTS user_update_notifications ON public.notifications;
CREATE POLICY user_update_notifications
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR public.is_admin_user()
  OR public.has_role('manager')
)
WITH CHECK (
  recipient_user_id = auth.uid()
  OR public.is_admin_user()
  OR public.has_role('manager')
);

-- Policy 6: Insertion réservée au service_role / triggers (pas depuis le client React)
DROP POLICY IF EXISTS service_insert_notifications ON public.notifications;
CREATE POLICY service_insert_notifications
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- ============================================
-- PARTIE 2: Mise à jour des policies PRODUCTS
-- ============================================

-- Policy 3: Admins et super_admins peuvent insérer des produits (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins et super_admins peuvent modifier des produits (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 5: Admins et super_admins peuvent supprimer des produits (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 3: Mise à jour des policies CATEGORIES
-- ============================================

-- Policy 2: Admins et super_admins peuvent insérer des catégories (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Policy 3: Admins et super_admins peuvent modifier des catégories (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins et super_admins peuvent supprimer des catégories (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, toutes les policies utilisent maintenant :
-- - utilisateurs.role_id (FK) + relation JOIN avec roles
-- - roles.slug pour vérifier le rôle
-- ============================================

