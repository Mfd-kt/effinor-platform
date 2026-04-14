-- Fiches CEE : paramètres de calcul + opérations : saisie et kWhc calculé.

ALTER TABLE public.cee_sheets
  ADD COLUMN calculation_profile text NOT NULL DEFAULT 'manual',
  ADD COLUMN input_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN calculation_config jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.cee_sheets.calculation_profile IS
  'manual | linear_single | product_two — voir compute CEE côté app.';
COMMENT ON COLUMN public.cee_sheets.input_fields IS
  'Tableau JSON : { key, label, type, unit?, required?, step?, min?, max? }.';
COMMENT ON COLUMN public.cee_sheets.calculation_config IS
  'Paramètres du calcul (clés, coefficients) selon calculation_profile.';

ALTER TABLE public.cee_sheets
  ADD CONSTRAINT cee_sheets_calculation_profile_check CHECK (
    calculation_profile IN ('manual', 'linear_single', 'product_two')
  );

ALTER TABLE public.operations
  ADD COLUMN cee_sheet_id uuid REFERENCES public.cee_sheets (id) ON DELETE SET NULL,
  ADD COLUMN cee_input_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN cee_kwhc_calculated double precision;

COMMENT ON COLUMN public.operations.cee_sheet_id IS 'Fiche CEE choisie (référentiel).';
COMMENT ON COLUMN public.operations.cee_input_values IS 'Valeurs saisies pour les champs définis sur la fiche (clé → nombre).';
COMMENT ON COLUMN public.operations.cee_kwhc_calculated IS 'Prime CEE calculée en kWhc (snapshot à l’enregistrement).';

CREATE INDEX idx_operations_cee_sheet_id ON public.operations (cee_sheet_id)
  WHERE deleted_at IS NULL AND cee_sheet_id IS NOT NULL;
