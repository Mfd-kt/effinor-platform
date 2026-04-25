-- =============================================================================
-- Simulateur CEE — persistance des simulations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cee_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  raw_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  pac_eligible boolean,
  renov_eligible boolean,
  zone text CHECK (zone IS NULL OR zone IN ('idf', 'hors_idf', 'unknown')),
  income_category text CHECK (
    income_category IS NULL
    OR income_category IN ('tres_modeste', 'modeste', 'intermediaire', 'superieur')
  ),
  CONSTRAINT cee_simulations_raw_answers_object CHECK (jsonb_typeof(raw_answers) = 'object'),
  CONSTRAINT cee_simulations_result_object CHECK (jsonb_typeof(result_snapshot) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_cee_simulations_lead_id ON public.cee_simulations (lead_id);
CREATE INDEX IF NOT EXISTS idx_cee_simulations_created_by ON public.cee_simulations (created_by);
CREATE INDEX IF NOT EXISTS idx_cee_simulations_created_at ON public.cee_simulations (created_at DESC);

COMMENT ON TABLE public.cee_simulations IS 'Simulations CEE créées depuis l’ERP (réponses brutes + snapshot du calcul serveur).';

ALTER TABLE public.cee_simulations ENABLE ROW LEVEL SECURITY;

-- Lecture : ligne créée par l’utilisateur
CREATE POLICY cee_simulations_select_own ON public.cee_simulations
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Lecture : staff (hors sales_agent — voir politique own)
CREATE POLICY cee_simulations_select_staff ON public.cee_simulations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code IN ('super_admin', 'admin', 'sales_director', 'closer')
  ));

-- Insertion : uniquement pour soi (client authentifié — le flux principal utilise le service admin)
CREATE POLICY cee_simulations_insert_own ON public.cee_simulations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
