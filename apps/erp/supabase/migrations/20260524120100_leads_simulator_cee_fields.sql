-- =============================================================================
-- Leads — champs complémentaires simulateur CEE
-- =============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pac_eligible boolean,
  ADD COLUMN IF NOT EXISTS renov_eligible boolean,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS next_callback_date date,
  ADD COLUMN IF NOT EXISTS next_callback_time time;

COMMENT ON COLUMN public.leads.pac_eligible IS 'Snapshot éligibilité PAC (BAR-TH-179) lors de la création via simulateur CEE.';
COMMENT ON COLUMN public.leads.renov_eligible IS 'Snapshot éligibilité rénovation globale (BAR-TH-174) via simulateur CEE.';
