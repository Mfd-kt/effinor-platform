-- Journalisation « connexion en tant que » (super_admin, écriture serveur uniquement via service_role)
CREATE TABLE public.impersonation_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN ('impersonation_started', 'impersonation_stopped')),
  actor_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_audit_actor ON public.impersonation_audit_events (actor_user_id, created_at DESC);
CREATE INDEX idx_impersonation_audit_target ON public.impersonation_audit_events (impersonated_user_id, created_at DESC);

COMMENT ON TABLE public.impersonation_audit_events IS
  'Audit impersonation super_admin : événements début/fin, métadonnées réseau. Lecture/écriture via service_role côté app.';

ALTER TABLE public.impersonation_audit_events ENABLE ROW LEVEL SECURITY;
