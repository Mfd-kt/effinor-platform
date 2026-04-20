-- =============================================================================
-- Statut qualification `to_validate` + traçabilité lot (créateur, entrée stock).
-- =============================================================================

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_qualification_status_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_qualification_status_check CHECK (
    qualification_status IN ('pending', 'to_validate', 'qualified', 'rejected', 'duplicate')
  );

COMMENT ON COLUMN public.lead_generation_stock.qualification_status IS
  'to_validate = en attente validation quantificateur avant diffusion commerciale.';

ALTER TABLE public.lead_generation_import_batches
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.lead_generation_import_batches
  ADD COLUMN IF NOT EXISTS stock_initial_qualification text NOT NULL DEFAULT 'qualified';

ALTER TABLE public.lead_generation_import_batches
  DROP CONSTRAINT IF EXISTS lead_generation_import_batches_stock_initial_qualification_check;

ALTER TABLE public.lead_generation_import_batches
  ADD CONSTRAINT lead_generation_import_batches_stock_initial_qualification_check CHECK (
    stock_initial_qualification IN ('qualified', 'to_validate')
  );

COMMENT ON COLUMN public.lead_generation_import_batches.created_by_user_id IS
  'Utilisateur ayant lancé l’import (ex. quantificateur).';

COMMENT ON COLUMN public.lead_generation_import_batches.stock_initial_qualification IS
  'Qualification initiale des fiches créées : qualified (historique) ou to_validate (pipeline quantificateur).';

CREATE INDEX IF NOT EXISTS idx_lead_generation_import_batches_created_by_user_id
  ON public.lead_generation_import_batches (created_by_user_id);
