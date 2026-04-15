-- =============================================================================
-- Preuves de géolocalisation au démarrage de visite technique (traçabilité terrain).
-- V1 : événements type visit_start uniquement ; extensible (visit_end, etc.).
-- =============================================================================

CREATE TABLE public.technical_visit_geo_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_visit_id uuid NOT NULL REFERENCES public.technical_visits (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'visit_start'
    CONSTRAINT technical_visit_geo_proofs_kind_check CHECK (kind = 'visit_start'),
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  client_captured_at timestamptz,
  server_recorded_at timestamptz NOT NULL DEFAULT now(),
  provider_error_code text
    CONSTRAINT technical_visit_geo_proofs_provider_err_check CHECK (
      provider_error_code IS NULL
      OR provider_error_code IN ('refused', 'unavailable', 'timeout', 'incompatible')
    ),
  distance_to_site_m double precision,
  coherence text NOT NULL
    CONSTRAINT technical_visit_geo_proofs_coherence_check CHECK (
      coherence IN (
        'on_site',
        'near_site',
        'far_from_site',
        'site_coords_missing',
        'geo_unavailable',
        'geo_refused'
      )
    ),
  worksite_latitude_snapshot double precision,
  worksite_longitude_snapshot double precision,
  CONSTRAINT technical_visit_geo_proofs_coords_when_ok CHECK (
    (provider_error_code IS NOT NULL AND latitude IS NULL AND longitude IS NULL)
    OR (provider_error_code IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

COMMENT ON TABLE public.technical_visit_geo_proofs IS
  'Preuve GPS liée à une action terrain (ex. démarrage visite). Données revendiquées par le client ; distance recalculée côté serveur.';
COMMENT ON COLUMN public.technical_visit_geo_proofs.coherence IS
  'Classification serveur : on_site / near_site / far_from_site / site_coords_missing / geo_unavailable / geo_refused.';
COMMENT ON COLUMN public.technical_visit_geo_proofs.worksite_latitude_snapshot IS
  'Copie des coordonnées site au moment de l’enregistrement (audit).';

CREATE INDEX idx_technical_visit_geo_proofs_visit_id
  ON public.technical_visit_geo_proofs (technical_visit_id);
CREATE INDEX idx_technical_visit_geo_proofs_visit_recorded
  ON public.technical_visit_geo_proofs (technical_visit_id, server_recorded_at DESC);

ALTER TABLE public.technical_visit_geo_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visit_geo_proofs_all_active"
  ON public.technical_visit_geo_proofs FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
