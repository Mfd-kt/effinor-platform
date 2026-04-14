-- Position carte : géocodage adresse travaux (WGS84), rempli côté app à la sauvegarde.
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_latitude double precision,
  ADD COLUMN IF NOT EXISTS worksite_longitude double precision;

COMMENT ON COLUMN public.technical_visits.worksite_latitude IS 'Latitude WGS84 (adresse travaux).';
COMMENT ON COLUMN public.technical_visits.worksite_longitude IS 'Longitude WGS84 (adresse travaux).';
