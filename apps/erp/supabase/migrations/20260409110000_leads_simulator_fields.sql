-- =============================================================================
-- Leads simulator enrichment (commercial destratification quick simulation)
-- =============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sim_height_m numeric(10, 2),
  ADD COLUMN IF NOT EXISTS sim_surface_m2 numeric(14, 2),
  ADD COLUMN IF NOT EXISTS sim_client_type text,
  ADD COLUMN IF NOT EXISTS sim_model text,
  ADD COLUMN IF NOT EXISTS sim_heating_mode text,
  ADD COLUMN IF NOT EXISTS sim_consigne text,
  ADD COLUMN IF NOT EXISTS sim_volume_m3 numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_air_change_rate numeric(10, 4),
  ADD COLUMN IF NOT EXISTS sim_model_capacity_m3h numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_needed_destrat integer,
  ADD COLUMN IF NOT EXISTS sim_power_kw numeric(16, 4),
  ADD COLUMN IF NOT EXISTS sim_consumption_kwh_year numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_cost_year_min numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_cost_year_max numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_cost_year_selected numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_saving_kwh_30 numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_saving_eur_30_min numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_saving_eur_30_max numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_saving_eur_30_selected numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_co2_saved_tons numeric(16, 4),
  ADD COLUMN IF NOT EXISTS sim_cee_prime_estimated numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_install_unit_price numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_install_total_price numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_rest_to_charge numeric(16, 2),
  ADD COLUMN IF NOT EXISTS sim_lead_score integer,
  ADD COLUMN IF NOT EXISTS sim_payload_json jsonb,
  ADD COLUMN IF NOT EXISTS sim_version text,
  ADD COLUMN IF NOT EXISTS simulated_at timestamptz,
  ADD COLUMN IF NOT EXISTS simulated_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_simulated_at ON public.leads (simulated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_simulated_by_user_id ON public.leads (simulated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_user_id ON public.leads (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_sim_client_type ON public.leads (sim_client_type);
CREATE INDEX IF NOT EXISTS idx_leads_sim_lead_score ON public.leads (sim_lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_simulated_at ON public.leads (assigned_to, simulated_at DESC);

COMMENT ON COLUMN public.leads.sim_payload_json IS
  'Snapshot complet de simulation commerciale (inputs normalisés + outputs calculés serveur).';
COMMENT ON COLUMN public.leads.sim_version IS
  'Version du moteur de calcul simulateur (ex: sim-v1).';
