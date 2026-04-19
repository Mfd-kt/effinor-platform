-- Accélère la détection de doublon par `normalized_company_name` à l’ingestion.
CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_normalized_company_name_lookup
  ON public.lead_generation_stock (normalized_company_name)
  WHERE normalized_company_name IS NOT NULL AND BTRIM(normalized_company_name) <> '';

COMMENT ON INDEX public.idx_lead_generation_stock_normalized_company_name_lookup IS
  'Recherche rapide des fiches partageant la même raison normalisée (dédup import).';
