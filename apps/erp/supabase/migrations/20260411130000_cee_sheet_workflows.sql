-- =============================================================================
-- Architecture métier pilotée par fiche CEE
-- - équipes dédiées par fiche
-- - workflows lead x fiche
-- - historique d'événements
-- - rattachements progressifs à l'existant (leads, VT, paniers, documents)
-- ============================================================================
-- ---------------------------------------------------------------------------
-- 1. Enrichissement du référentiel fiches CEE
-- ---------------------------------------------------------------------------

ALTER TABLE public.cee_sheets
  ADD COLUMN IF NOT EXISTS simulator_key text,
  ADD COLUMN IF NOT EXISTS presentation_template_key text,
  ADD COLUMN IF NOT EXISTS agreement_template_key text,
  ADD COLUMN IF NOT EXISTS requires_technical_visit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_quote boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS workflow_key text,
  ADD COLUMN IF NOT EXISTS is_commercial_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.cee_sheets
  ALTER COLUMN sort_order SET DEFAULT 100;

COMMENT ON COLUMN public.cee_sheets.simulator_key IS
  'Identifiant applicatif du simulateur à utiliser pour cette fiche CEE.';
COMMENT ON COLUMN public.cee_sheets.presentation_template_key IS
  'Clé du modèle de présentation commerciale associé à la fiche.';
COMMENT ON COLUMN public.cee_sheets.agreement_template_key IS
  'Clé du modèle d''accord commercial associé à la fiche.';
COMMENT ON COLUMN public.cee_sheets.workflow_key IS
  'Clé applicative du workflow métier de la fiche.';
COMMENT ON COLUMN public.cee_sheets.is_commercial_active IS
  'Permet de désactiver commercialement une fiche sans la supprimer.';

-- ---------------------------------------------------------------------------
-- 2. Equipes dédiées par fiche CEE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cee_sheet_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cee_sheet_id uuid NOT NULL REFERENCES public.cee_sheets (id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cee_sheet_teams_name_nonempty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_cee_sheet_teams_sheet_id
  ON public.cee_sheet_teams (cee_sheet_id);
CREATE INDEX IF NOT EXISTS idx_cee_sheet_teams_active
  ON public.cee_sheet_teams (is_active)
  WHERE is_active = true;

COMMENT ON TABLE public.cee_sheet_teams IS
  'Equipe commerciale de référence rattachée à une fiche CEE.';

CREATE TABLE IF NOT EXISTS public.cee_sheet_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cee_sheet_team_id uuid NOT NULL REFERENCES public.cee_sheet_teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_in_team text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cee_sheet_team_members_role_allowed CHECK (
    role_in_team IN ('agent', 'confirmateur', 'closer', 'manager')
  ),
  CONSTRAINT cee_sheet_team_members_unique UNIQUE (cee_sheet_team_id, user_id, role_in_team)
);

CREATE INDEX IF NOT EXISTS idx_cee_sheet_team_members_team_id
  ON public.cee_sheet_team_members (cee_sheet_team_id);
CREATE INDEX IF NOT EXISTS idx_cee_sheet_team_members_user_id
  ON public.cee_sheet_team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_cee_sheet_team_members_role
  ON public.cee_sheet_team_members (role_in_team);
CREATE INDEX IF NOT EXISTS idx_cee_sheet_team_members_active
  ON public.cee_sheet_team_members (is_active)
  WHERE is_active = true;

COMMENT ON TABLE public.cee_sheet_team_members IS
  'Membres d''une équipe fiche CEE avec leur rôle métier (agent, confirmateur, closer, manager).';

-- ---------------------------------------------------------------------------
-- 3. Workflows métier par fiche CEE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_sheet_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  cee_sheet_id uuid NOT NULL REFERENCES public.cee_sheets (id) ON DELETE RESTRICT,
  cee_sheet_team_id uuid REFERENCES public.cee_sheet_teams (id) ON DELETE SET NULL,
  workflow_status text NOT NULL,
  assigned_agent_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_confirmateur_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_closer_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  simulation_input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  qualification_data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  presentation_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  agreement_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  quote_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  agreement_signature_status text,
  agreement_signature_provider text,
  agreement_signature_request_id text,
  agreement_sent_at timestamptz,
  agreement_signed_at timestamptz,
  closer_notes text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_sheet_workflows_status_nonempty CHECK (length(trim(workflow_status)) > 0),
  CONSTRAINT lead_sheet_workflows_simulation_input_is_object CHECK (
    jsonb_typeof(simulation_input_json) = 'object'
  ),
  CONSTRAINT lead_sheet_workflows_simulation_result_is_object CHECK (
    jsonb_typeof(simulation_result_json) = 'object'
  ),
  CONSTRAINT lead_sheet_workflows_qualification_is_object CHECK (
    jsonb_typeof(qualification_data_json) = 'object'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_sheet_workflows_active_lead_sheet_unique
  ON public.lead_sheet_workflows (lead_id, cee_sheet_id)
  WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_lead_id
  ON public.lead_sheet_workflows (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_sheet_id
  ON public.lead_sheet_workflows (cee_sheet_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_team_id
  ON public.lead_sheet_workflows (cee_sheet_team_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_status
  ON public.lead_sheet_workflows (workflow_status);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_agent
  ON public.lead_sheet_workflows (assigned_agent_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_confirmateur
  ON public.lead_sheet_workflows (assigned_confirmateur_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_closer
  ON public.lead_sheet_workflows (assigned_closer_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflows_active
  ON public.lead_sheet_workflows (is_archived)
  WHERE is_archived = false;

COMMENT ON TABLE public.lead_sheet_workflows IS
  'Tunnel métier principal d''un lead pour une fiche CEE donnée.';

CREATE TABLE IF NOT EXISTS public.lead_sheet_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_sheet_workflow_id uuid NOT NULL REFERENCES public.lead_sheet_workflows (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_label text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_sheet_workflow_events_type_nonempty CHECK (length(trim(event_type)) > 0),
  CONSTRAINT lead_sheet_workflow_events_label_nonempty CHECK (length(trim(event_label)) > 0),
  CONSTRAINT lead_sheet_workflow_events_payload_is_object CHECK (jsonb_typeof(payload_json) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflow_events_workflow_id
  ON public.lead_sheet_workflow_events (lead_sheet_workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_sheet_workflow_events_type
  ON public.lead_sheet_workflow_events (event_type);

COMMENT ON TABLE public.lead_sheet_workflow_events IS
  'Historique simple des événements métier d''un workflow par fiche CEE.';

-- ---------------------------------------------------------------------------
-- 4. Enrichissement transitoire de leads et rattachements autour du workflow
-- ---------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cee_sheet_id uuid REFERENCES public.cee_sheets (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_channel text,
  ADD COLUMN IF NOT EXISTS lead_origin text;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES public.lead_sheet_workflows (id) ON DELETE SET NULL;

ALTER TABLE public.project_carts
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES public.lead_sheet_workflows (id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS current_workflow_id uuid REFERENCES public.lead_sheet_workflows (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_cee_sheet_id ON public.leads (cee_sheet_id);
CREATE INDEX IF NOT EXISTS idx_leads_current_workflow_id ON public.leads (current_workflow_id);
CREATE INDEX IF NOT EXISTS idx_technical_visits_workflow_id ON public.technical_visits (workflow_id);
CREATE INDEX IF NOT EXISTS idx_project_carts_workflow_id ON public.project_carts (workflow_id);

COMMENT ON COLUMN public.leads.cee_sheet_id IS
  'Fiche CEE principale du lead pour compatibilité transitoire et navigation.';
COMMENT ON COLUMN public.leads.current_workflow_id IS
  'Workflow métier courant du lead dans l''architecture pilotée par fiche CEE.';
COMMENT ON COLUMN public.project_carts.workflow_id IS
  'Rattachement futur/actif du panier produit à un workflow fiche CEE.';
COMMENT ON COLUMN public.technical_visits.workflow_id IS
  'Rattachement optionnel d''une visite technique à un workflow fiche CEE.';

-- ---------------------------------------------------------------------------
-- 5. Triggers updated_at
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_cee_sheet_teams_updated_at ON public.cee_sheet_teams;
CREATE TRIGGER set_cee_sheet_teams_updated_at
  BEFORE UPDATE ON public.cee_sheet_teams
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_cee_sheet_team_members_updated_at ON public.cee_sheet_team_members;
CREATE TRIGGER set_cee_sheet_team_members_updated_at
  BEFORE UPDATE ON public.cee_sheet_team_members
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_sheet_workflows_updated_at ON public.lead_sheet_workflows;
CREATE TRIGGER set_lead_sheet_workflows_updated_at
  BEFORE UPDATE ON public.lead_sheet_workflows
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Permissions / RLS helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_has_role_code(target_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code = target_code
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_manage_cee_workflows()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('sales_director');
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_member_of_cee_sheet_team(target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cee_sheet_team_members m
    INNER JOIN public.cee_sheet_teams t ON t.id = m.cee_sheet_team_id
    WHERE m.user_id = auth.uid()
      AND m.cee_sheet_team_id = target_team_id
      AND m.is_active = true
      AND t.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_access_lead_sheet_workflow(target_workflow_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_sheet_workflows w
    WHERE w.id = target_workflow_id
      AND (
        public.current_user_can_manage_cee_workflows()
        OR w.assigned_agent_user_id = auth.uid()
        OR w.assigned_confirmateur_user_id = auth.uid()
        OR w.assigned_closer_user_id = auth.uid()
        OR (
          w.cee_sheet_team_id IS NOT NULL
          AND public.current_user_is_member_of_cee_sheet_team(w.cee_sheet_team_id)
        )
      )
  );
$$;

COMMENT ON FUNCTION public.current_user_can_manage_cee_workflows() IS
  'Super-admin, admin et directeur commercial disposent d''une vue large sur les workflows CEE.';

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.cee_sheet_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_sheet_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sheet_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sheet_workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cee_sheet_teams_select_scoped" ON public.cee_sheet_teams;
CREATE POLICY "cee_sheet_teams_select_scoped"
  ON public.cee_sheet_teams FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR public.current_user_is_member_of_cee_sheet_team(id)
    )
  );

DROP POLICY IF EXISTS "cee_sheet_teams_insert_manage" ON public.cee_sheet_teams;
CREATE POLICY "cee_sheet_teams_insert_manage"
  ON public.cee_sheet_teams FOR INSERT TO authenticated
  WITH CHECK (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "cee_sheet_teams_update_manage" ON public.cee_sheet_teams;
CREATE POLICY "cee_sheet_teams_update_manage"
  ON public.cee_sheet_teams FOR UPDATE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows())
  WITH CHECK (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "cee_sheet_teams_delete_manage" ON public.cee_sheet_teams;
CREATE POLICY "cee_sheet_teams_delete_manage"
  ON public.cee_sheet_teams FOR DELETE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "cee_sheet_team_members_select_scoped" ON public.cee_sheet_team_members;
CREATE POLICY "cee_sheet_team_members_select_scoped"
  ON public.cee_sheet_team_members FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR user_id = auth.uid()
      OR public.current_user_is_member_of_cee_sheet_team(cee_sheet_team_id)
    )
  );

DROP POLICY IF EXISTS "cee_sheet_team_members_insert_manage" ON public.cee_sheet_team_members;
CREATE POLICY "cee_sheet_team_members_insert_manage"
  ON public.cee_sheet_team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "cee_sheet_team_members_update_manage" ON public.cee_sheet_team_members;
CREATE POLICY "cee_sheet_team_members_update_manage"
  ON public.cee_sheet_team_members FOR UPDATE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows())
  WITH CHECK (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "cee_sheet_team_members_delete_manage" ON public.cee_sheet_team_members;
CREATE POLICY "cee_sheet_team_members_delete_manage"
  ON public.cee_sheet_team_members FOR DELETE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "lead_sheet_workflows_select_scoped" ON public.lead_sheet_workflows;
CREATE POLICY "lead_sheet_workflows_select_scoped"
  ON public.lead_sheet_workflows FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR assigned_confirmateur_user_id = auth.uid()
      OR assigned_closer_user_id = auth.uid()
      OR (
        cee_sheet_team_id IS NOT NULL
        AND public.current_user_is_member_of_cee_sheet_team(cee_sheet_team_id)
      )
    )
  );

DROP POLICY IF EXISTS "lead_sheet_workflows_insert_scoped" ON public.lead_sheet_workflows;
CREATE POLICY "lead_sheet_workflows_insert_scoped"
  ON public.lead_sheet_workflows FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR assigned_confirmateur_user_id = auth.uid()
      OR assigned_closer_user_id = auth.uid()
      OR (
        cee_sheet_team_id IS NOT NULL
        AND public.current_user_is_member_of_cee_sheet_team(cee_sheet_team_id)
      )
    )
  );

DROP POLICY IF EXISTS "lead_sheet_workflows_update_scoped" ON public.lead_sheet_workflows;
CREATE POLICY "lead_sheet_workflows_update_scoped"
  ON public.lead_sheet_workflows FOR UPDATE TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR assigned_confirmateur_user_id = auth.uid()
      OR assigned_closer_user_id = auth.uid()
      OR (
        cee_sheet_team_id IS NOT NULL
        AND public.current_user_is_member_of_cee_sheet_team(cee_sheet_team_id)
      )
    )
  )
  WITH CHECK (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR assigned_confirmateur_user_id = auth.uid()
      OR assigned_closer_user_id = auth.uid()
      OR (
        cee_sheet_team_id IS NOT NULL
        AND public.current_user_is_member_of_cee_sheet_team(cee_sheet_team_id)
      )
    )
  );

DROP POLICY IF EXISTS "lead_sheet_workflows_delete_manage" ON public.lead_sheet_workflows;
CREATE POLICY "lead_sheet_workflows_delete_manage"
  ON public.lead_sheet_workflows FOR DELETE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

DROP POLICY IF EXISTS "lead_sheet_workflow_events_select_scoped" ON public.lead_sheet_workflow_events;
CREATE POLICY "lead_sheet_workflow_events_select_scoped"
  ON public.lead_sheet_workflow_events FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND public.current_user_can_access_lead_sheet_workflow(lead_sheet_workflow_id)
  );

DROP POLICY IF EXISTS "lead_sheet_workflow_events_insert_scoped" ON public.lead_sheet_workflow_events;
CREATE POLICY "lead_sheet_workflow_events_insert_scoped"
  ON public.lead_sheet_workflow_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_profile()
    AND public.current_user_can_access_lead_sheet_workflow(lead_sheet_workflow_id)
  );

DROP POLICY IF EXISTS "lead_sheet_workflow_events_delete_manage" ON public.lead_sheet_workflow_events;
CREATE POLICY "lead_sheet_workflow_events_delete_manage"
  ON public.lead_sheet_workflow_events FOR DELETE TO authenticated
  USING (public.is_active_profile() AND public.current_user_can_manage_cee_workflows());

GRANT EXECUTE ON FUNCTION public.current_user_has_role_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_cee_workflows() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_member_of_cee_sheet_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_access_lead_sheet_workflow(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Permissions applicatives complémentaires
-- ---------------------------------------------------------------------------

INSERT INTO public.permissions (code, label_fr, description)
VALUES
  (
    'perm.access.cee_workflows',
    'Accès : workflows CEE',
    'Permet d’accéder aux workflows pilotés par fiche CEE.'
  ),
  (
    'perm.cee_workflows.scope_all',
    'Workflows CEE : tout le périmètre',
    'Voir tous les workflows pilotés par fiche CEE.'
  ),
  (
    'perm.cee_workflows.scope_team',
    'Workflows CEE : périmètre équipe',
    'Limiter la vue aux workflows des fiches appartenant aux équipes de l’utilisateur.'
  ),
  (
    'perm.cee_workflows.manage_teams',
    'Workflows CEE : gestion des équipes',
    'Créer et modifier les équipes par fiche CEE.'
  )
ON CONFLICT (code) DO UPDATE
SET
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code IN (
  'perm.access.cee_workflows',
  'perm.cee_workflows.scope_all',
  'perm.cee_workflows.manage_teams'
)
WHERE r.code IN ('super_admin', 'admin', 'sales_director')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code IN (
  'perm.access.cee_workflows',
  'perm.cee_workflows.scope_team'
)
WHERE r.code IN ('sales_agent', 'confirmer', 'closer')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Realtime
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_sheet_workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_sheet_workflow_events;