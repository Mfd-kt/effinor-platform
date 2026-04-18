-- Mini-étape 10.1 : niveau de fiabilité explicite pour les suggestions enriched_*

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS enrichment_confidence text NOT NULL DEFAULT 'low';

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_enrichment_confidence_check;

ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_enrichment_confidence_check CHECK (
  enrichment_confidence IN ('low', 'medium', 'high')
);

COMMENT ON COLUMN public.lead_generation_stock.enrichment_confidence IS
  'Fiabilité perçue des suggestions (enriched_*) : heuristique actuelle = low ; pas de validation DNS/email automatique.';
