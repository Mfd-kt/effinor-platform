-- L’app persiste `photos` comme objet { visit_photos, report_pdfs, sketches } (jsonb object).
-- L’ancienne contrainte n’acceptait qu’un tableau JSON, d’où l’erreur
-- "violates check constraint technical_visits_photos_is_array".

ALTER TABLE public.technical_visits
  DROP CONSTRAINT IF EXISTS technical_visits_photos_is_array;

ALTER TABLE public.technical_visits
  DROP CONSTRAINT IF EXISTS technical_visits_photos_jsonb_kind;

ALTER TABLE public.technical_visits
  ADD CONSTRAINT technical_visits_photos_jsonb_kind CHECK (
    jsonb_typeof(photos) IN ('array', 'object')
  );

COMMENT ON COLUMN public.technical_visits.photos IS
  'jsonb : tableau d’URLs (legacy) ou objet { visit_photos, report_pdfs, sketches } (Storage / URLs).';
