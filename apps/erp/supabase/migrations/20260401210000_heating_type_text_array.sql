-- Modes de chauffage : sélection multiple (liste de codes).
ALTER TABLE public.leads
  ALTER COLUMN heating_type TYPE text[]
  USING (
    CASE
      WHEN heating_type IS NULL OR btrim(heating_type::text) = '' THEN NULL
      ELSE ARRAY[btrim(heating_type::text)]::text[]
    END
  );

ALTER TABLE public.technical_visits
  ALTER COLUMN heating_type TYPE text[]
  USING (
    CASE
      WHEN heating_type IS NULL OR btrim(heating_type::text) = '' THEN NULL
      ELSE ARRAY[btrim(heating_type::text)]::text[]
    END
  );

COMMENT ON COLUMN public.leads.heating_type IS 'Modes : fioul, gaz, pac, electricite, autres (text[]).';
COMMENT ON COLUMN public.technical_visits.heating_type IS 'Modes : fioul, gaz, pac, electricite, autres (text[]).';
