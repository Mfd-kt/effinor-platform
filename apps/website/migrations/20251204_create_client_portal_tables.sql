-- ============================================
-- Migration: Créer les tables pour l'espace client B2B
-- ============================================
-- Date: 2025-12-04
-- Description: Tables pour gérer l'espace client (clients, projets, documents, devis)
-- ============================================

-- ============================================
-- ÉTAPE 1: Vérifier que les fonctions helper existent
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin_user' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction is_admin_user() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction has_role() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table clients_portail
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients_portail (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  supabase_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  siret TEXT,
  contact_name TEXT,
  contact_email TEXT,
  phone TEXT,
  secteur TEXT,
  taille_entreprise TEXT
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.clients_portail IS 'Table pour gérer les clients B2B avec accès à l''espace client';
COMMENT ON COLUMN public.clients_portail.id IS 'Identifiant unique du client';
COMMENT ON COLUMN public.clients_portail.supabase_user_id IS 'Référence vers auth.users (unique)';
COMMENT ON COLUMN public.clients_portail.company_name IS 'Nom de l''entreprise';
COMMENT ON COLUMN public.clients_portail.siret IS 'Numéro SIRET';
COMMENT ON COLUMN public.clients_portail.contact_name IS 'Nom du contact principal';
COMMENT ON COLUMN public.clients_portail.contact_email IS 'Email du contact';
COMMENT ON COLUMN public.clients_portail.phone IS 'Téléphone du contact';
COMMENT ON COLUMN public.clients_portail.secteur IS 'Secteur d''activité';
COMMENT ON COLUMN public.clients_portail.taille_entreprise IS 'Taille de l''entreprise';

-- Index sur supabase_user_id (déjà géré par UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_clients_portail_supabase_user_id ON public.clients_portail(supabase_user_id);

-- ============================================
-- ÉTAPE 3: Créer la table client_projects
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  client_id UUID NOT NULL REFERENCES public.clients_portail(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  type TEXT,
  statut TEXT,
  lien_rea UUID REFERENCES public.realisations(id) ON DELETE SET NULL
);

-- Commentaires
COMMENT ON TABLE public.client_projects IS 'Table pour gérer les projets clients';
COMMENT ON COLUMN public.client_projects.client_id IS 'Référence vers le client';
COMMENT ON COLUMN public.client_projects.titre IS 'Titre du projet';
COMMENT ON COLUMN public.client_projects.type IS 'Type de projet';
COMMENT ON COLUMN public.client_projects.statut IS 'Statut du projet';
COMMENT ON COLUMN public.client_projects.lien_rea IS 'Lien optionnel vers une réalisation';

-- Index
CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON public.client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_lien_rea ON public.client_projects(lien_rea);

-- ============================================
-- ÉTAPE 4: Créer la table client_documents
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients_portail(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  type_doc TEXT NOT NULL CHECK (type_doc IN ('doe', 'fiche_technique', 'facture', 'plan', 'autre')),
  file_url TEXT NOT NULL
);

-- Commentaires
COMMENT ON TABLE public.client_documents IS 'Table pour gérer les documents clients';
COMMENT ON COLUMN public.client_documents.client_id IS 'Référence vers le client';
COMMENT ON COLUMN public.client_documents.titre IS 'Titre du document';
COMMENT ON COLUMN public.client_documents.type_doc IS 'Type de document (doe, fiche_technique, facture, plan, autre)';
COMMENT ON COLUMN public.client_documents.file_url IS 'URL du fichier (Supabase Storage)';

-- Index
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type_doc ON public.client_documents(type_doc);

-- ============================================
-- ÉTAPE 5: Créer la table client_quotes
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  client_id UUID NOT NULL REFERENCES public.clients_portail(id) ON DELETE CASCADE,
  numero_devis TEXT NOT NULL,
  montant_ht NUMERIC NOT NULL,
  statut TEXT,
  pdf_url TEXT
);

-- Commentaires
COMMENT ON TABLE public.client_quotes IS 'Table pour gérer les devis clients';
COMMENT ON COLUMN public.client_quotes.client_id IS 'Référence vers le client';
COMMENT ON COLUMN public.client_quotes.numero_devis IS 'Numéro du devis';
COMMENT ON COLUMN public.client_quotes.montant_ht IS 'Montant HT du devis';
COMMENT ON COLUMN public.client_quotes.statut IS 'Statut du devis';
COMMENT ON COLUMN public.client_quotes.pdf_url IS 'URL du PDF (Supabase Storage)';

-- Index
CREATE INDEX IF NOT EXISTS idx_client_quotes_client_id ON public.client_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_quotes_numero_devis ON public.client_quotes(numero_devis);

-- ============================================
-- ÉTAPE 6: Créer les triggers pour updated_at
-- ============================================

-- Trigger pour clients_portail
CREATE OR REPLACE FUNCTION public.update_clients_portail_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_clients_portail_updated_at ON public.clients_portail;
CREATE TRIGGER trigger_update_clients_portail_updated_at
  BEFORE UPDATE ON public.clients_portail
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_portail_updated_at();

-- Trigger pour client_projects
CREATE OR REPLACE FUNCTION public.update_client_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_client_projects_updated_at ON public.client_projects;
CREATE TRIGGER trigger_update_client_projects_updated_at
  BEFORE UPDATE ON public.client_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_projects_updated_at();

-- Trigger pour client_quotes
CREATE OR REPLACE FUNCTION public.update_client_quotes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_client_quotes_updated_at ON public.client_quotes;
CREATE TRIGGER trigger_update_client_quotes_updated_at
  BEFORE UPDATE ON public.client_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_quotes_updated_at();

-- ============================================
-- ÉTAPE 7: Activer RLS sur toutes les tables
-- ============================================

ALTER TABLE public.clients_portail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_quotes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 8: Supprimer les anciennes policies (si elles existent)
-- ============================================

-- clients_portail
DROP POLICY IF EXISTS "Clients can view own account" ON public.clients_portail;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients_portail;
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients_portail;

-- client_projects
DROP POLICY IF EXISTS "Clients can view own projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.client_projects;

-- client_documents
DROP POLICY IF EXISTS "Clients can view own documents" ON public.client_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.client_documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.client_documents;

-- client_quotes
DROP POLICY IF EXISTS "Clients can view own quotes" ON public.client_quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.client_quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.client_quotes;

-- ============================================
-- ÉTAPE 9: Créer les policies RLS
-- ============================================

-- ===== clients_portail =====

-- Policy 1: Client voit uniquement son compte
CREATE POLICY "Clients can view own account"
ON public.clients_portail
FOR SELECT
TO authenticated
USING (
  supabase_user_id = auth.uid()
);

-- Policy 2: Admin voit tous les clients
CREATE POLICY "Admins can view all clients"
ON public.clients_portail
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- Policy 3: Admin peut gérer tous les clients
CREATE POLICY "Admins can manage clients"
ON public.clients_portail
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ===== client_projects =====

-- Policy 1: Client voit uniquement ses projets
CREATE POLICY "Clients can view own projects"
ON public.client_projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients_portail cp
    WHERE cp.id = client_projects.client_id
    AND cp.supabase_user_id = auth.uid()
  )
);

-- Policy 2: Admin voit tous les projets
CREATE POLICY "Admins can view all projects"
ON public.client_projects
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- Policy 3: Admin peut gérer tous les projets
CREATE POLICY "Admins can manage projects"
ON public.client_projects
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ===== client_documents =====

-- Policy 1: Client voit uniquement ses documents
CREATE POLICY "Clients can view own documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients_portail cp
    WHERE cp.id = client_documents.client_id
    AND cp.supabase_user_id = auth.uid()
  )
);

-- Policy 2: Admin voit tous les documents
CREATE POLICY "Admins can view all documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- Policy 3: Admin peut gérer tous les documents
CREATE POLICY "Admins can manage documents"
ON public.client_documents
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ===== client_quotes =====

-- Policy 1: Client voit uniquement ses devis
CREATE POLICY "Clients can view own quotes"
ON public.client_quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients_portail cp
    WHERE cp.id = client_quotes.client_id
    AND cp.supabase_user_id = auth.uid()
  )
);

-- Policy 2: Admin voit tous les devis
CREATE POLICY "Admins can view all quotes"
ON public.client_quotes
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- Policy 3: Admin peut gérer tous les devis
CREATE POLICY "Admins can manage quotes"
ON public.client_quotes
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ============================================
-- ÉTAPE 10: Vérifications finales
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clients_portail'
  ) THEN
    RAISE EXCEPTION 'La table clients_portail n''a pas été créée correctement';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'client_projects'
  ) THEN
    RAISE EXCEPTION 'La table client_projects n''a pas été créée correctement';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'client_documents'
  ) THEN
    RAISE EXCEPTION 'La table client_documents n''a pas été créée correctement';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'client_quotes'
  ) THEN
    RAISE EXCEPTION 'La table client_quotes n''a pas été créée correctement';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Tables espace client créées avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table clients_portail: ✅';
  RAISE NOTICE '   - Table client_projects: ✅';
  RAISE NOTICE '   - Table client_documents: ✅';
  RAISE NOTICE '   - Table client_quotes: ✅';
  RAISE NOTICE '   - Triggers updated_at: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;














