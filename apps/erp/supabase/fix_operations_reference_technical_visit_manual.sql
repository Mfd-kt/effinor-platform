-- =============================================================================
-- Si erreur PostgREST : Could not find the 'reference_technical_visit_id'
-- column of 'operations' in the schema cache
-- (équivalent migration 20260331200000_operations_reference_technical_visit.sql).
-- Idempotent.
-- Après exécution : Tableau de bord Supabase → Project Settings → API
-- → « Reload schema » (ou attendre quelques minutes).
-- =============================================================================

ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS reference_technical_visit_id uuid REFERENCES public.technical_visits (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_operations_reference_technical_visit_id
  ON public.operations (reference_technical_visit_id);

COMMENT ON COLUMN public.operations.reference_technical_visit_id IS
  'Visite technique de référence ayant précédé l’ouverture du dossier opération.';
