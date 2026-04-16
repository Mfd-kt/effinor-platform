-- Localisation des profils (origine distance contextualisée des techniciens)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line_1 text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_country text;

COMMENT ON COLUMN public.profiles.address_line_1 IS
  'Adresse principale du profil (ex: technicien) pour calculs de distance contextuels.';
COMMENT ON COLUMN public.profiles.postal_code IS
  'Code postal du profil (origine de distance côté technicien).';
COMMENT ON COLUMN public.profiles.city IS
  'Ville du profil (origine de distance côté technicien).';
COMMENT ON COLUMN public.profiles.country IS
  'Pays du profil (optionnel, par défaut France).';
COMMENT ON COLUMN public.profiles.latitude IS
  'Latitude du profil pour calcul de distance Haversine.';
COMMENT ON COLUMN public.profiles.longitude IS
  'Longitude du profil pour calcul de distance Haversine.';
COMMENT ON COLUMN public.technical_visits.worksite_country IS
  'Pays du chantier (équivalent métier de site_country).';