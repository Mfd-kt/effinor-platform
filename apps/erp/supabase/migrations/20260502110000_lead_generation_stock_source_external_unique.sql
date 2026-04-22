-- =============================================================================
-- Contrainte d'unicité composite (source, source_external_id)
-- =============================================================================
-- Nécessaire pour permettre upsert(onConflict: "source,source_external_id")
-- lors de l'ingestion des items Apify (Le Bon Coin, futures sources).
-- Empêche l'import multiple d'une même annonce depuis la même plateforme.
-- Idempotent : la contrainte a pu être posée manuellement avant cette migration.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lead_generation_stock_source_external_unique'
      AND conrelid = 'public.lead_generation_stock'::regclass
  ) THEN
    ALTER TABLE public.lead_generation_stock
      ADD CONSTRAINT lead_generation_stock_source_external_unique
      UNIQUE (source, source_external_id);
  END IF;
END
$$;
