-- Recherche GPT : statut « terminé avec lacunes » (validation serveur insuffisante).

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_research_gpt_status_check;
ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_research_gpt_status_check CHECK (
  research_gpt_status IN ('idle', 'pending', 'completed', 'completed_with_warning', 'failed')
);

COMMENT ON COLUMN public.lead_generation_stock.research_gpt_status IS
  'Recherche GPT quantification : idle | pending | completed | completed_with_warning | failed.';
