-- Journal UI minimal (analytics interne produit) pour les vues lead-generation.

CREATE TABLE IF NOT EXISTS public.lead_generation_ui_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_ui_events_type_check CHECK (
    event_type IN (
      'my_queue_stale_return_shown'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_lg_ui_events_user_created
  ON public.lead_generation_ui_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lg_ui_events_type_created
  ON public.lead_generation_ui_events (event_type, created_at DESC);

ALTER TABLE public.lead_generation_ui_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_generation_ui_events_all_active" ON public.lead_generation_ui_events;
CREATE POLICY "lead_generation_ui_events_all_active"
  ON public.lead_generation_ui_events
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
