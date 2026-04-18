-- =============================================================================
-- Lead generation stock — étape 1 : structure SQL minimale
-- - Journal d’imports, stock central, assignations agents
-- - Traçabilité future vers public.leads (colonnes nullable)
-- - Pas de logique métier / triggers métier (hors updated_at)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. Journal des imports (Apify, scripts, etc.)
-- -----------------------------------------------------------------------------

CREATE TABLE public.lead_generation_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_label text,
  job_reference text,
  status text NOT NULL DEFAULT 'pending',
  imported_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_import_batches_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  )
);

COMMENT ON TABLE public.lead_generation_import_batches IS
  'Journal des imports de fiches commerciales (scraping, fichiers, jobs externes).';

-- -----------------------------------------------------------------------------
-- B. Stock central — une ligne = une fiche entreprise
-- Règle documentée : une fiche sans téléphone peut exister en stock brut ;
-- le rejet explicite pourra utiliser rejection_reason = ''no_phone'' (pas d’automatisation ici).
-- -----------------------------------------------------------------------------

CREATE TABLE public.lead_generation_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid REFERENCES public.lead_generation_import_batches (id) ON DELETE SET NULL,
  source text NOT NULL,
  source_external_id text,
  company_name text NOT NULL,
  normalized_company_name text,
  phone text,
  normalized_phone text,
  email text,
  normalized_email text,
  website text,
  normalized_domain text,
  address text,
  postal_code text,
  city text,
  category text,
  sub_category text,
  siret text,
  headcount_range text,
  target_score integer NOT NULL DEFAULT 0,
  phone_status text NOT NULL DEFAULT 'missing',
  email_status text NOT NULL DEFAULT 'missing',
  website_status text NOT NULL DEFAULT 'missing',
  qualification_status text NOT NULL DEFAULT 'pending',
  stock_status text NOT NULL DEFAULT 'new',
  rejection_reason text,
  duplicate_of_stock_id uuid REFERENCES public.lead_generation_stock (id) ON DELETE SET NULL,
  converted_lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  current_assignment_id uuid,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_stock_phone_status_check CHECK (phone_status IN ('found', 'missing')),
  CONSTRAINT lead_generation_stock_email_status_check CHECK (email_status IN ('found', 'missing')),
  CONSTRAINT lead_generation_stock_website_status_check CHECK (website_status IN ('found', 'missing')),
  CONSTRAINT lead_generation_stock_qualification_status_check CHECK (
    qualification_status IN ('pending', 'qualified', 'rejected', 'duplicate')
  ),
  CONSTRAINT lead_generation_stock_stock_status_check CHECK (
    stock_status IN (
      'new',
      'ready',
      'assigned',
      'in_progress',
      'converted',
      'rejected',
      'expired',
      'archived'
    )
  )
);

COMMENT ON TABLE public.lead_generation_stock IS
  'Stock de fiches commerciales importées ; distribution et conversion vers public.leads en étapes ultérieures.';
COMMENT ON COLUMN public.lead_generation_stock.rejection_reason IS
  'Libre ; ex. ''no_phone'' si la fiche est rejetée faute de numéro exploitable.';

-- -----------------------------------------------------------------------------
-- C. Assignations agent ↔ fiche stock
-- -----------------------------------------------------------------------------

CREATE TABLE public.lead_generation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.lead_generation_stock (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  batch_number integer,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  last_activity_at timestamptz,
  consumed_at timestamptz,
  assignment_status text NOT NULL DEFAULT 'assigned',
  outcome text NOT NULL DEFAULT 'pending',
  outcome_reason text,
  created_lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  recycled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_assignments_assignment_status_check CHECK (
    assignment_status IN ('assigned', 'opened', 'in_progress', 'consumed', 'expired', 'recycled')
  ),
  CONSTRAINT lead_generation_assignments_outcome_check CHECK (
    outcome IN (
      'pending',
      'converted_to_lead',
      'out_of_target',
      'cancelled',
      'invalid_data',
      'duplicate',
      'no_answer_exhausted'
    )
  )
);

COMMENT ON TABLE public.lead_generation_assignments IS
  'Attribution d’une fiche stock à un agent ; suivi de cycle de vie et lien optionnel vers le lead créé.';

-- FK circulaire : stock.current_assignment_id → assignments (après création des assignments)
ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_current_assignment_id_fkey
  FOREIGN KEY (current_assignment_id)
  REFERENCES public.lead_generation_assignments (id)
  ON DELETE SET NULL;

-- Traçabilité sur les leads existants (nullable, sans impact sur l’historique)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_generation_stock_id uuid REFERENCES public.lead_generation_stock (id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_generation_assignment_id uuid REFERENCES public.lead_generation_assignments (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.leads.lead_generation_stock_id IS
  'Lien optionnel vers la fiche du stock lead generation ayant servi à créer ce lead.';
COMMENT ON COLUMN public.leads.lead_generation_assignment_id IS
  'Lien optionnel vers l’assignation agent ayant mené à ce lead.';

-- -----------------------------------------------------------------------------
-- Index
-- -----------------------------------------------------------------------------

CREATE INDEX idx_lead_generation_import_batches_status ON public.lead_generation_import_batches (status);
CREATE INDEX idx_lead_generation_import_batches_created_at_desc ON public.lead_generation_import_batches (created_at DESC);

CREATE INDEX idx_lead_generation_stock_import_batch_id ON public.lead_generation_stock (import_batch_id);
CREATE INDEX idx_lead_generation_stock_stock_status ON public.lead_generation_stock (stock_status);
CREATE INDEX idx_lead_generation_stock_qualification_status ON public.lead_generation_stock (qualification_status);
CREATE INDEX idx_lead_generation_stock_normalized_phone ON public.lead_generation_stock (normalized_phone);
CREATE INDEX idx_lead_generation_stock_normalized_email ON public.lead_generation_stock (normalized_email);
CREATE INDEX idx_lead_generation_stock_normalized_domain ON public.lead_generation_stock (normalized_domain);
CREATE INDEX idx_lead_generation_stock_siret ON public.lead_generation_stock (siret);
CREATE INDEX idx_lead_generation_stock_converted_lead_id ON public.lead_generation_stock (converted_lead_id);
CREATE INDEX idx_lead_generation_stock_current_assignment_id ON public.lead_generation_stock (current_assignment_id);
CREATE INDEX idx_lead_generation_stock_status_score_created ON public.lead_generation_stock (
  stock_status,
  target_score DESC,
  created_at ASC
);
CREATE INDEX idx_lead_generation_stock_ready_dispatch ON public.lead_generation_stock (target_score DESC, created_at ASC)
  WHERE stock_status = 'ready';

CREATE INDEX idx_lead_generation_assignments_stock_id ON public.lead_generation_assignments (stock_id);
CREATE INDEX idx_lead_generation_assignments_agent_id ON public.lead_generation_assignments (agent_id);
CREATE INDEX idx_lead_generation_assignments_assignment_status ON public.lead_generation_assignments (assignment_status);
CREATE INDEX idx_lead_generation_assignments_outcome ON public.lead_generation_assignments (outcome);
CREATE INDEX idx_lead_generation_assignments_created_lead_id ON public.lead_generation_assignments (created_lead_id);
CREATE INDEX idx_lead_generation_assignments_agent_status_assigned_at ON public.lead_generation_assignments (
  agent_id,
  assignment_status,
  assigned_at DESC
);

CREATE INDEX idx_leads_lead_generation_stock_id ON public.leads (lead_generation_stock_id);
CREATE INDEX idx_leads_lead_generation_assignment_id ON public.leads (lead_generation_assignment_id);

-- -----------------------------------------------------------------------------
-- Triggers updated_at (fonction existante du projet)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_lead_generation_import_batches_updated_at ON public.lead_generation_import_batches;
CREATE TRIGGER set_lead_generation_import_batches_updated_at
  BEFORE UPDATE ON public.lead_generation_import_batches
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_generation_stock_updated_at ON public.lead_generation_stock;
CREATE TRIGGER set_lead_generation_stock_updated_at
  BEFORE UPDATE ON public.lead_generation_stock
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_generation_assignments_updated_at ON public.lead_generation_assignments;
CREATE TRIGGER set_lead_generation_assignments_updated_at
  BEFORE UPDATE ON public.lead_generation_assignments
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — même esprit que public.leads (profils actifs)
-- -----------------------------------------------------------------------------

ALTER TABLE public.lead_generation_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_generation_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_generation_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_import_batches_all_active"
  ON public.lead_generation_import_batches
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "lead_generation_stock_all_active"
  ON public.lead_generation_stock
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "lead_generation_assignments_all_active"
  ON public.lead_generation_assignments
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
