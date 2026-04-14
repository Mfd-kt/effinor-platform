-- =============================================================================
-- Visites techniques — objet métier autonome (LEAD -> VT -> Bénéficiaire -> Opération)
-- =============================================================================

CREATE TYPE public.technical_visit_status AS ENUM (
  'to_schedule',
  'scheduled',
  'performed',
  'report_pending',
  'validated',
  'refused',
  'cancelled'
);

COMMENT ON TYPE public.technical_visit_status IS 'Cycle de vie d’une visite technique.';

CREATE TABLE public.technical_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vt_reference text NOT NULL UNIQUE DEFAULT (
    'VT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))
  ),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE RESTRICT,
  beneficiary_id uuid REFERENCES public.beneficiaries (id) ON DELETE SET NULL,
  status public.technical_visit_status NOT NULL DEFAULT 'to_schedule',
  scheduled_at timestamptz,
  performed_at timestamptz,
  time_slot text,
  technician_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  worksite_address text,
  surface_m2 numeric(14, 2),
  ceiling_height_m numeric(10, 2),
  heating_type text,
  observations text,
  technical_report text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT technical_visits_vt_reference_nonempty CHECK (length(trim(vt_reference)) > 0),
  CONSTRAINT technical_visits_photos_is_array CHECK (jsonb_typeof(photos) = 'array')
);

COMMENT ON TABLE public.technical_visits IS 'Visites techniques : photos, rapport et données terrain liés au lead puis au bénéficiaire.';
COMMENT ON COLUMN public.technical_visits.vt_reference IS 'Référence métier VT (ex. VT-20260331-A1B2C3D4).';
COMMENT ON COLUMN public.technical_visits.photos IS 'Tableau JSON : URLs publiques ou chemins Storage Supabase.';

CREATE INDEX idx_technical_visits_lead_id ON public.technical_visits (lead_id);
CREATE INDEX idx_technical_visits_beneficiary_id ON public.technical_visits (beneficiary_id);
CREATE INDEX idx_technical_visits_status ON public.technical_visits (status);
CREATE INDEX idx_technical_visits_scheduled_at ON public.technical_visits (scheduled_at DESC);
CREATE INDEX idx_technical_visits_technician_id ON public.technical_visits (technician_id);
CREATE INDEX idx_technical_visits_deleted_at ON public.technical_visits (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER set_technical_visits_updated_at
  BEFORE UPDATE ON public.technical_visits FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.technical_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visits_all_active"
  ON public.technical_visits FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
