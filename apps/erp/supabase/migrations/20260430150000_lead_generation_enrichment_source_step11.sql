-- Étape 11 : traçabilité heuristic vs vérification Firecrawl ciblée

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS enrichment_source text NOT NULL DEFAULT 'heuristic';

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_enrichment_source_check;

ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_enrichment_source_check CHECK (
  enrichment_source IN ('heuristic', 'firecrawl')
);

COMMENT ON COLUMN public.lead_generation_stock.enrichment_source IS
  'Origine des données enriched_* : heuristique (étape 10) ou lecture site public via Firecrawl (étape 11).';
