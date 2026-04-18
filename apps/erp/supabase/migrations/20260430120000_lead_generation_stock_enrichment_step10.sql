-- Étape 10 : enrichissement manuel ciblé (compléments sans écraser email/website sources)

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS enrichment_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_error text,
  ADD COLUMN IF NOT EXISTS enriched_email text,
  ADD COLUMN IF NOT EXISTS enriched_domain text,
  ADD COLUMN IF NOT EXISTS enriched_website text;

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_enrichment_status_check;

ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_enrichment_status_check CHECK (
  enrichment_status IN ('not_started', 'in_progress', 'completed', 'failed')
);

COMMENT ON COLUMN public.lead_generation_stock.enrichment_status IS
  'État pipeline enrichissement manuel (étape 10) ; ne modifie pas email/website d''origine.';
COMMENT ON COLUMN public.lead_generation_stock.enriched_email IS
  'Suggestion contact@domaine ; complément si email source absent.';
COMMENT ON COLUMN public.lead_generation_stock.enriched_domain IS
  'Domaine déduit (site, email existant ou heuristique).';
COMMENT ON COLUMN public.lead_generation_stock.enriched_website IS
  'URL suggérée https://… ; complément si site source absent.';
