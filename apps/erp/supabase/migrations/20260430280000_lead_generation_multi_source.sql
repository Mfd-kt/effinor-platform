-- Multi-source Apify (Maps + Pages Jaunes + signaux LinkedIn) — métadonnées stock.

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS has_linkedin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_decision_maker boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_signal_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_channels text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS linkedin_url text;

COMMENT ON COLUMN public.lead_generation_stock.has_linkedin IS
  'Indique si une URL ou un signal LinkedIn exploitable a été associé à la fiche (enrichissement contrôlé).';
COMMENT ON COLUMN public.lead_generation_stock.has_decision_maker IS
  'Décideur identifié (nom renseigné) — cohérent avec decision_maker_*.';
COMMENT ON COLUMN public.lead_generation_stock.source_signal_score IS
  'Score de qualité lié aux canaux d''acquisition (Maps = base, Pages Jaunes = plus, LinkedIn = premium).';
COMMENT ON COLUMN public.lead_generation_stock.source_channels IS
  'Liste des canaux ayant contribué : google_maps, yellow_pages, linkedin.';
COMMENT ON COLUMN public.lead_generation_stock.linkedin_url IS
  'URL profil ou page entreprise LinkedIn si disponible (sources publiques uniquement).';

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_source_signal_score_check;
ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_source_signal_score_check CHECK (
    source_signal_score >= 0 AND source_signal_score <= 100
  );

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_source_signal_score
  ON public.lead_generation_stock (source_signal_score DESC)
  WHERE stock_status = 'ready' AND has_linkedin = false;
