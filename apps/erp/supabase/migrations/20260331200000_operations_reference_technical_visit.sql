-- =============================================================================
-- Opérations : lien vers la visite technique de référence (flux VT → Opération)
-- =============================================================================

ALTER TABLE public.operations
  ADD COLUMN reference_technical_visit_id uuid REFERENCES public.technical_visits (id) ON DELETE SET NULL;

CREATE INDEX idx_operations_reference_technical_visit_id ON public.operations (reference_technical_visit_id);

COMMENT ON COLUMN public.operations.reference_technical_visit_id IS
  'Visite technique de référence ayant précédé l’ouverture du dossier opération.';
