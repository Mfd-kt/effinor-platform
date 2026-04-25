-- Migration: création de la table contacts
-- Date: 2026-04-25
-- Description: Table pour les demandes de contact via formulaires publics
--              (site vitrine, landings). Distincte de la table leads qui
--              concerne les prospects qualifiés avec projet CEE.

BEGIN;

-- ============================================================
-- ENUM : contact_status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
    CREATE TYPE contact_status AS ENUM (
      'new',          -- Nouveau message, non lu
      'read',         -- Lu mais pas encore traité
      'replied',      -- Réponse envoyée
      'archived',     -- Archivé (clos)
      'spam'          -- Marqué comme spam
    );
  END IF;
END$$;

COMMENT ON TYPE contact_status IS 'Statut de traitement d''une demande de contact';

-- ============================================================
-- TABLE : contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Identité du contact
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NULL,                    -- Format E.164 (+33...)

  -- Contenu du message
  subject text NULL,
  message text NOT NULL,

  -- Origine
  source text NOT NULL DEFAULT 'website_form',  -- 'website_form', 'landing_pac', 'landing_reno_global', 'api'
  source_url text NULL,                          -- URL exacte de la page d'origine

  -- Traitement interne
  status contact_status NOT NULL DEFAULT 'new',
  assigned_to uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at timestamptz NULL,
  notes text NULL,                    -- Notes internes (non visibles du contact)

  -- Metadata technique (user-agent, IP anonymisée, etc.)
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Contraintes
  CONSTRAINT contacts_email_format CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  CONSTRAINT contacts_first_name_not_empty CHECK (length(trim(first_name)) > 0),
  CONSTRAINT contacts_last_name_not_empty CHECK (length(trim(last_name)) > 0),
  CONSTRAINT contacts_message_not_empty CHECK (length(trim(message)) > 0),
  CONSTRAINT contacts_phone_e164_format CHECK (phone IS NULL OR phone ~ '^\+\d{8,15}$')
);

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE public.contacts IS 'Demandes de contact via formulaires publics. Distinct des leads (prospects CEE qualifiés).';
COMMENT ON COLUMN public.contacts.phone IS 'Téléphone au format E.164 (+33...). Validé via contrainte CHECK.';
COMMENT ON COLUMN public.contacts.source IS 'Origine du contact : website_form, landing_pac, landing_reno_global, api...';
COMMENT ON COLUMN public.contacts.source_url IS 'URL complète de la page d''origine (pour analytics)';
COMMENT ON COLUMN public.contacts.assigned_to IS 'Utilisateur ERP (admin/daf/admin_agent) qui traite la demande';
COMMENT ON COLUMN public.contacts.notes IS 'Notes internes ERP, non visibles côté contact';
COMMENT ON COLUMN public.contacts.metadata IS 'Données techniques : user-agent, IP anonymisée, referrer, utm_*';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts (status);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts (lower(email));
CREATE INDEX IF NOT EXISTS idx_contacts_source ON public.contacts (source);

-- ============================================================
-- TRIGGER : auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_contacts_updated_at();

-- ============================================================
-- TRIGGER : auto-set replied_at quand status passe à 'replied'
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_contacts_replied_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'replied' AND OLD.status IS DISTINCT FROM 'replied' AND NEW.replied_at IS NULL THEN
    NEW.replied_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contacts_replied_at ON public.contacts;
CREATE TRIGGER trg_contacts_replied_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_contacts_replied_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Note: utilise current_user_has_role_code() défini dans
--       20260411130000_cee_sheet_workflows.sql (JOIN user_roles → roles)
-- ============================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy : INSERT public (formulaires anonymes)
DROP POLICY IF EXISTS "contacts_insert_public" ON public.contacts;
CREATE POLICY "contacts_insert_public"
  ON public.contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy : SELECT pour staff autorisé
DROP POLICY IF EXISTS "contacts_select_staff" ON public.contacts;
CREATE POLICY "contacts_select_staff"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('daf')
    OR public.current_user_has_role_code('admin_agent')
  );

-- Policy : UPDATE pour staff autorisé
DROP POLICY IF EXISTS "contacts_update_staff" ON public.contacts;
CREATE POLICY "contacts_update_staff"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('daf')
    OR public.current_user_has_role_code('admin_agent')
  )
  WITH CHECK (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('daf')
    OR public.current_user_has_role_code('admin_agent')
  );

-- Policy : DELETE uniquement super_admin
DROP POLICY IF EXISTS "contacts_delete_super_admin" ON public.contacts;
CREATE POLICY "contacts_delete_super_admin"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_has_role_code('super_admin')
  );

-- ============================================================
-- GRANTS (cohérence avec policies)
-- ============================================================
GRANT INSERT ON public.contacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

COMMIT;
