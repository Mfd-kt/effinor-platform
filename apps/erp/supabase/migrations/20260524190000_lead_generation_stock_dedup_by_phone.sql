-- =============================================================================
-- lead_generation_stock — bascule de la dédup
-- =============================================================================
-- Avant : unique (source, source_external_id)
-- Après : unique (normalized_phone) — même prospect = doublon, peu importe la source
--
-- Pourquoi : un même particulier peut publier sur PAP, LBC, etc. Et republie
-- régulièrement la même annonce avec un nouvel ID. La dédup pertinente côté
-- commercial = le téléphone (= la personne à appeler).
--
-- ⚠️ DESTRUCTIF — vide la table `lead_generation_stock` pour repartir propre.
-- =============================================================================

-- 1. Vider le stock + lots associés (CASCADE pour FKs)
TRUNCATE TABLE public.lead_generation_stock RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.lead_generation_import_batches RESTART IDENTITY CASCADE;

-- 2. Drop l'ancienne contrainte (source, source_external_id)
ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_source_external_unique;

-- 3. Index unique sur normalized_phone.
-- PostgreSQL traite chaque NULL comme distinct (NULLS DISTINCT par défaut),
-- donc les lignes sans téléphone ne déclenchent pas de conflit entre elles.
-- Index NON partiel pour que `INSERT ... ON CONFLICT (normalized_phone)` fonctionne.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_generation_stock_normalized_phone
  ON public.lead_generation_stock (normalized_phone);

-- 4. Index non-unique de support sur (source, source_external_id) — utile pour
--    `tagPapStockRowsWithImportBatch` qui filtre par source + external_id.
CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_source_external
  ON public.lead_generation_stock (source, source_external_id);

COMMENT ON INDEX public.uniq_lead_generation_stock_normalized_phone IS
  'Dédup par téléphone normalisé (E.164). Index partiel : multiples NULL autorisés.';
