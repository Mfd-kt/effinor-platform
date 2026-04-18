-- Étape 13 — file d’attente « prêt à distribuer » (décision métier explicite)

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS dispatch_queue_status text NOT NULL DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS dispatch_queue_reason text,
  ADD COLUMN IF NOT EXISTS dispatch_queue_rank integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispatch_queue_evaluated_at timestamptz;

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_dispatch_queue_status_check;

ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_dispatch_queue_status_check CHECK (
  dispatch_queue_status IN (
    'ready_now',
    'enrich_first',
    'review',
    'low_value',
    'do_not_dispatch'
  )
);

COMMENT ON COLUMN public.lead_generation_stock.dispatch_queue_status IS
  'Décision file de dispatch (étape 13) : prêt à distribuer, enrichir avant, revoir, faible valeur, ne pas distribuer.';
COMMENT ON COLUMN public.lead_generation_stock.dispatch_queue_reason IS
  'Libellé court expliquant le classement (affichage métier).';
COMMENT ON COLUMN public.lead_generation_stock.dispatch_queue_rank IS
  'Ordre secondaire pour tri (plus grand = plus prioritaire dans la file).';
COMMENT ON COLUMN public.lead_generation_stock.dispatch_queue_evaluated_at IS
  'Dernier recalcul manuel de la décision de file.';

CREATE INDEX IF NOT EXISTS idx_lead_gen_stock_dispatch_queue_status
  ON public.lead_generation_stock (dispatch_queue_status);

CREATE INDEX IF NOT EXISTS idx_lead_gen_stock_dispatch_queue_rank_desc
  ON public.lead_generation_stock (dispatch_queue_rank DESC);
