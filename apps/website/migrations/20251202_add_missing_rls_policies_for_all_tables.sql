-- ============================================
-- Migration: Ajouter/mettre à jour toutes les RLS policies manquantes
-- ============================================
-- Cette migration ajoute ou met à jour les RLS policies pour toutes les tables
-- qui nécessitent un accès admin, en utilisant la relation roles via role_id
-- 
-- IMPORTANT: Exécutez d'abord 20251202_fix_utilisateurs_rls_recursion.sql
-- pour créer les fonctions helper is_admin_user() et has_role()
-- ============================================

-- ============================================
-- PARTIE 1: Table UTILISATEURS
-- ============================================
-- NOTE: Les policies pour utilisateurs sont gérées dans 
-- 20251202_fix_utilisateurs_rls_recursion.sql pour éviter la récursion infinie
-- Cette migration ne touche pas à utilisateurs pour éviter les conflits
-- ============================================

-- ============================================
-- PARTIE 2: Table ROLES
-- ============================================

-- Activer RLS sur roles si ce n'est pas déjà fait
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tous les utilisateurs authentifiés peuvent voir les rôles
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.roles;
CREATE POLICY "Authenticated can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Admins peuvent gérer les rôles (utilise la fonction helper pour éviter la récursion)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles"
ON public.roles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================
-- PARTIE 3: Table VISITEURS
-- ============================================

-- Activer RLS sur visiteurs si ce n'est pas déjà fait
ALTER TABLE public.visiteurs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins peuvent voir tous les visiteurs (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can view visitors" ON public.visiteurs;
CREATE POLICY "Admins can view visitors"
ON public.visiteurs
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Policy 2: Permettre l'insertion anonyme (tracking)
DROP POLICY IF EXISTS "Allow anonymous visitor tracking" ON public.visiteurs;
CREATE POLICY "Allow anonymous visitor tracking"
ON public.visiteurs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 3: Permettre la mise à jour (tracking)
DROP POLICY IF EXISTS "Allow visitor updates" ON public.visiteurs;
CREATE POLICY "Allow visitor updates"
ON public.visiteurs
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Admins peuvent supprimer les visiteurs (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can delete visitors" ON public.visiteurs;
CREATE POLICY "Admins can delete visitors"
ON public.visiteurs
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 4: Table LEADS
-- ============================================

-- Activer RLS sur leads si ce n'est pas déjà fait
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy 1: Permettre l'insertion anonyme (formulaires publics)
DROP POLICY IF EXISTS "Allow anonymous insert on leads" ON public.leads;
CREATE POLICY "Allow anonymous insert on leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Utilisateurs authentifiés peuvent voir les leads
-- (Les commerciaux verront uniquement leurs leads assignés via le code frontend)
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
CREATE POLICY "Authenticated users can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins peuvent modifier les leads (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer les leads (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 5: Table COMMANDES
-- ============================================

-- Activer RLS sur commandes si ce n'est pas déjà fait
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Utilisateurs authentifiés peuvent créer des commandes
DROP POLICY IF EXISTS "Authenticated can create orders" ON public.commandes;
CREATE POLICY "Authenticated can create orders"
ON public.commandes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Utilisateurs authentifiés peuvent voir les commandes
-- (Les commerciaux verront uniquement leurs commandes assignées via le code frontend)
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.commandes;
CREATE POLICY "Authenticated can view orders"
ON public.commandes
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admins peuvent modifier les commandes (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can update orders" ON public.commandes;
CREATE POLICY "Admins can update orders"
ON public.commandes
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Policy 4: Admins peuvent supprimer les commandes (utilise la fonction helper)
DROP POLICY IF EXISTS "Admins can delete orders" ON public.commandes;
CREATE POLICY "Admins can delete orders"
ON public.commandes
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ============================================
-- PARTIE 6: Table COMMANDES_LIGNES (si elle existe)
-- ============================================

-- Activer RLS sur commandes_lignes si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commandes_lignes') THEN
    ALTER TABLE public.commandes_lignes ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Utilisateurs authentifiés peuvent voir les lignes de commandes
    DROP POLICY IF EXISTS "Authenticated can view order lines" ON public.commandes_lignes;
    CREATE POLICY "Authenticated can view order lines"
    ON public.commandes_lignes
    FOR SELECT
    TO authenticated
    USING (true);

    -- Policy 2: Admins peuvent gérer les lignes de commandes (utilise la fonction helper)
    DROP POLICY IF EXISTS "Admins can manage order lines" ON public.commandes_lignes;
    CREATE POLICY "Admins can manage order lines"
    ON public.commandes_lignes
    FOR ALL
    TO authenticated
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());
  END IF;
END $$;

-- ============================================
-- PARTIE 7: Table LEADS_NOTES (si elle existe)
-- ============================================

-- Activer RLS sur leads_notes si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads_notes') THEN
    ALTER TABLE public.leads_notes ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Utilisateurs authentifiés peuvent voir les notes
    DROP POLICY IF EXISTS "Authenticated can view lead notes" ON public.leads_notes;
    CREATE POLICY "Authenticated can view lead notes"
    ON public.leads_notes
    FOR SELECT
    TO authenticated
    USING (true);

    -- Policy 2: Utilisateurs authentifiés peuvent créer des notes
    DROP POLICY IF EXISTS "Authenticated can insert lead notes" ON public.leads_notes;
    CREATE POLICY "Authenticated can insert lead notes"
    ON public.leads_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Policy 3: Admins peuvent modifier les notes (utilise la fonction helper)
    DROP POLICY IF EXISTS "Admins can update lead notes" ON public.leads_notes;
    CREATE POLICY "Admins can update lead notes"
    ON public.leads_notes
    FOR UPDATE
    TO authenticated
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

    -- Policy 4: Admins peuvent supprimer les notes (utilise la fonction helper)
    DROP POLICY IF EXISTS "Admins can delete lead notes" ON public.leads_notes;
    CREATE POLICY "Admins can delete lead notes"
    ON public.leads_notes
    FOR DELETE
    TO authenticated
    USING (public.is_admin_user());
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, toutes les tables principales devraient avoir des RLS policies
-- qui utilisent la relation roles via utilisateurs.role_id
-- ============================================

