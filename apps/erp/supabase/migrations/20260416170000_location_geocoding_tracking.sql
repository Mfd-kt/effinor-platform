ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS geocoding_status text,
  ADD COLUMN IF NOT EXISTS geocoding_provider text,
  ADD COLUMN IF NOT EXISTS geocoding_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS geocoding_error text,
  ADD COLUMN IF NOT EXISTS geocoding_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS geocoding_status text,
  ADD COLUMN IF NOT EXISTS geocoding_provider text,
  ADD COLUMN IF NOT EXISTS geocoding_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS geocoding_error text,
  ADD COLUMN IF NOT EXISTS geocoding_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.geocoding_status IS
  'Statut geocodage profil: complete_geocoded | complete_not_geocoded | incomplete_address | invalid_coordinates | geocoding_error';
COMMENT ON COLUMN public.technical_visits.geocoding_status IS
  'Statut geocodage chantier: complete_geocoded | complete_not_geocoded | incomplete_address | invalid_coordinates | geocoding_error';
