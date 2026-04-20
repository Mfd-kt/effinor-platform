-- Recherche GPT (quantification) : dossier de qualification assisté, sans décision automatique définitive.

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS research_gpt_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS research_gpt_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS research_gpt_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS research_gpt_last_error text,
  ADD COLUMN IF NOT EXISTS research_gpt_payload jsonb,
  ADD COLUMN IF NOT EXISTS research_gpt_summary text;

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_research_gpt_status_check;
ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_research_gpt_status_check CHECK (
  research_gpt_status IN ('idle', 'pending', 'completed', 'failed')
);

COMMENT ON COLUMN public.lead_generation_stock.research_gpt_status IS
  'Recherche GPT quantification : idle | pending | completed | failed.';
COMMENT ON COLUMN public.lead_generation_stock.research_gpt_payload IS
  'Dernier résultat structuré (JSON) — aide à la qualification, pas source de vérité opérationnelle seule.';
COMMENT ON COLUMN public.lead_generation_stock.research_gpt_summary IS
  'Résumé court affichable (activité / reco), dérivé du dernier run.';
