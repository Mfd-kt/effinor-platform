-- Journal du cycle de vie des comptes (admin / conformité / audit métier).

CREATE TABLE IF NOT EXISTS public.user_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_lifecycle_events_event_type_check CHECK (
    event_type IN (
      'account_paused',
      'account_reactivated',
      'account_disabled',
      'account_deleted',
      'assignments_released'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_events_user_created
  ON public.user_lifecycle_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_events_type_created
  ON public.user_lifecycle_events (event_type, created_at DESC);

ALTER TABLE public.user_lifecycle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lifecycle_events_all_active" ON public.user_lifecycle_events;
CREATE POLICY "user_lifecycle_events_all_active"
  ON public.user_lifecycle_events
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

