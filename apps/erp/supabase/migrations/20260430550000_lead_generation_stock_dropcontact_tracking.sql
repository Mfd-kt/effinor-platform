-- Suivi MVP Dropcontact (requête + webhook), sans table annexe.

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS dropcontact_request_id text,
  ADD COLUMN IF NOT EXISTS dropcontact_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS dropcontact_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS dropcontact_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dropcontact_last_error text,
  ADD COLUMN IF NOT EXISTS dropcontact_raw_payload jsonb;

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_dropcontact_status_check;
ALTER TABLE public.lead_generation_stock ADD CONSTRAINT lead_generation_stock_dropcontact_status_check CHECK (
  dropcontact_status IN ('idle', 'pending', 'completed', 'failed')
);

COMMENT ON COLUMN public.lead_generation_stock.dropcontact_request_id IS 'Identifiant renvoyé par POST /v1/enrich/all (rappel webhook).';
COMMENT ON COLUMN public.lead_generation_stock.dropcontact_status IS 'Cycle Dropcontact : idle | pending (en attente webhook) | completed | failed.';
COMMENT ON COLUMN public.lead_generation_stock.dropcontact_raw_payload IS 'Dernier extrait utile côté serveur (audit léger), optionnel.';
