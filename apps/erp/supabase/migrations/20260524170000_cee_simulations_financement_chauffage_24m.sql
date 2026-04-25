-- =============================================================================
-- cee_simulations — règles métier BAR-TH-174 V A80.3 :
-- chauffage récent < 24 mois, âge logement (bascule ANAH), financement
-- =============================================================================

ALTER TABLE public.cee_simulations
  ADD COLUMN IF NOT EXISTS chauffage_24_mois boolean,
  ADD COLUMN IF NOT EXISTS age_logement text,
  ADD COLUMN IF NOT EXISTS financement text,
  ADD COLUMN IF NOT EXISTS financement_label text;

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_age_logement_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_age_logement_check
  CHECK (age_logement IS NULL OR age_logement IN ('moins_15_ans', 'plus_15_ans'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_financement_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_financement_check
  CHECK (financement IS NULL OR financement IN (
    'cee_x2', 'cee_simple', 'anah_bascule', 'non_applicable'
  ));

CREATE INDEX IF NOT EXISTS idx_cee_simulations_financement
  ON public.cee_simulations (financement);

COMMENT ON COLUMN public.cee_simulations.chauffage_24_mois IS
  'Chauffage remplacé dans les 24 derniers mois (bloqueur BAR-TH-174).';
COMMENT ON COLUMN public.cee_simulations.age_logement IS
  'Âge du logement — utilisé pour la règle de bascule ANAH (DPE E/F/G + > 15 ans).';
COMMENT ON COLUMN public.cee_simulations.financement IS
  'Canal de financement applicable : cee_x2 / cee_simple / anah_bascule / non_applicable.';
