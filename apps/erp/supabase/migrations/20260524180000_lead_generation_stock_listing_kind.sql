-- =============================================================================
-- lead_generation_stock — distinguer ventes et locations (PAP, LeBonCoin…)
-- Pour cibler le commercial : locataires = aides CEE différentes (isolation,
-- chauffage parfois — pas le même argumentaire que propriétaires).
-- =============================================================================

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS listing_kind text;

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_listing_kind_check;
ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_listing_kind_check
  CHECK (listing_kind IS NULL OR listing_kind IN ('sale', 'rental'));

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_listing_kind
  ON public.lead_generation_stock (listing_kind)
  WHERE listing_kind IS NOT NULL;

COMMENT ON COLUMN public.lead_generation_stock.listing_kind IS
  'Type d''annonce immobilière : sale (vente) / rental (location). Null pour sources non-immo.';
