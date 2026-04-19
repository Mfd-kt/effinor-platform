-- Enrichissement Dropcontact (manuel) + source décideur alignée.

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_enrichment_source_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_enrichment_source_check CHECK (
    enrichment_source IN ('heuristic', 'firecrawl', 'dropcontact')
  );

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_decision_maker_source_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_decision_maker_source_check CHECK (
    decision_maker_source IS NULL
    OR decision_maker_source IN ('website', 'google', 'linkedin', 'dropcontact')
  );

COMMENT ON COLUMN public.lead_generation_stock.enrichment_source IS
  'heuristic | firecrawl | dropcontact';
