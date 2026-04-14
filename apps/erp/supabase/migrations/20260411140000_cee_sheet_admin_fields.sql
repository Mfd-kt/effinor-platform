-- =============================================================================
-- Configuration admin avancée des fiches CEE
-- - catégorie de fiche
-- - notes internes d'administration
-- =============================================================================

ALTER TABLE public.cee_sheets
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

COMMENT ON COLUMN public.cee_sheets.category IS
  'Catégorie fonctionnelle/admin de la fiche CEE (ex. chauffage, isolation, LED).';
COMMENT ON COLUMN public.cee_sheets.internal_notes IS
  'Notes internes d’administration pour le paramétrage de la fiche.';
