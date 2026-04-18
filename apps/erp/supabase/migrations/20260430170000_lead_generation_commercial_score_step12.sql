-- Étape 12 : score commercial et priorisation (règles métier côté app)

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS commercial_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS commercial_score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commercial_scored_at timestamptz;

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_commercial_priority_check;

ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_commercial_priority_check CHECK (
  commercial_priority IN ('low', 'normal', 'high', 'critical')
);

COMMENT ON COLUMN public.lead_generation_stock.commercial_score IS
  'Score métier 0–100 pour priorisation (étape 12) ; distinct de target_score historique.';
COMMENT ON COLUMN public.lead_generation_stock.commercial_priority IS
  'Tranche de priorité dérivée du score commercial.';
COMMENT ON COLUMN public.lead_generation_stock.commercial_score_breakdown IS
  'Détail des points par règle (JSON).';

CREATE INDEX IF NOT EXISTS idx_lead_gen_stock_commercial_priority
  ON public.lead_generation_stock (commercial_priority);

CREATE INDEX IF NOT EXISTS idx_lead_gen_stock_commercial_score_desc
  ON public.lead_generation_stock (commercial_score DESC);
