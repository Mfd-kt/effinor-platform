-- Étape 19 — traçabilité anti-doublons avancés (score + motifs au moment de l’ingestion)

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS duplicate_match_score integer,
  ADD COLUMN IF NOT EXISTS duplicate_match_reasons jsonb;

COMMENT ON COLUMN public.lead_generation_stock.duplicate_match_score IS
  'Score 0–100 du rapprochement retenu lorsque la fiche est importée en doublon (étape 19).';

COMMENT ON COLUMN public.lead_generation_stock.duplicate_match_reasons IS
  'Codes de motifs de doublon (ex. exact_siret) — jsonb array de textes.';
