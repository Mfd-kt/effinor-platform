-- =============================================================================
-- À exécuter UNE FOIS dans Supabase : SQL Editor → New query → Run
-- si l'erreur apparaît : "Could not find the 'region' column of 'technical_visits'"
-- ou autre colonne manquante dans le schema cache.
-- Équivalent des migrations : 20260403220000 … 20260403270000
-- =============================================================================

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_postal_code text;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_city text;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_latitude double precision;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_longitude double precision;

COMMENT ON COLUMN public.technical_visits.region IS 'Région administrative (France), alignée sur la logique bénéficiaire / code postal.';
COMMENT ON COLUMN public.technical_visits.worksite_postal_code IS 'Code postal du lieu des travaux — utilisé pour calculer la région.';
COMMENT ON COLUMN public.technical_visits.worksite_city IS 'Ville du lieu des travaux (reprise lead).';
COMMENT ON COLUMN public.technical_visits.worksite_latitude IS 'Latitude WGS84 (adresse travaux).';
COMMENT ON COLUMN public.technical_visits.worksite_longitude IS 'Longitude WGS84 (adresse travaux).';

-- =============================================================================
-- Si erreur : "violates check constraint technical_visits_photos_is_array"
-- (migration 20260403270000_technical_visits_photos_grouped_jsonb.sql)
-- =============================================================================

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