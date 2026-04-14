-- =============================================================================
-- Rappels commerciaux (hors workflow simulateur / lead_sheet_workflows)
-- =============================================================================

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'commercial_callback';

CREATE TABLE public.commercial_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text,
  callback_date date NOT NULL,
  callback_time time without time zone,
  callback_time_window text,
  callback_comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT commercial_callbacks_status_check CHECK (
      status IN (
        'pending',
        'completed',
        'no_answer',
        'rescheduled',
        'cancelled',
        'converted_to_lead'
      )
    ),
  priority text NOT NULL DEFAULT 'normal'
    CONSTRAINT commercial_callbacks_priority_check CHECK (priority IN ('low', 'normal', 'high')),
  source text,
  assigned_agent_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  converted_lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commercial_callbacks_callback_time_window_check CHECK (
    callback_time_window IS NULL
    OR callback_time_window IN ('morning', 'afternoon', 'end_of_day', 'no_preference')
  )
);

CREATE INDEX idx_commercial_callbacks_agent_date ON public.commercial_callbacks (assigned_agent_user_id, callback_date);
CREATE INDEX idx_commercial_callbacks_status_date ON public.commercial_callbacks (status, callback_date);
CREATE INDEX idx_commercial_callbacks_active ON public.commercial_callbacks (deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.commercial_callbacks IS 'Rappels téléprospection légers, indépendants des leads / simulateur.';

DROP TRIGGER IF EXISTS set_commercial_callbacks_updated_at ON public.commercial_callbacks;
CREATE TRIGGER set_commercial_callbacks_updated_at
  BEFORE UPDATE ON public.commercial_callbacks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.commercial_callbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commercial_callbacks_select_scoped" ON public.commercial_callbacks;
CREATE POLICY "commercial_callbacks_select_scoped"
  ON public.commercial_callbacks FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND deleted_at IS NULL
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "commercial_callbacks_insert_scoped" ON public.commercial_callbacks;
CREATE POLICY "commercial_callbacks_insert_scoped"
  ON public.commercial_callbacks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_profile()
    AND deleted_at IS NULL
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "commercial_callbacks_update_scoped" ON public.commercial_callbacks;
CREATE POLICY "commercial_callbacks_update_scoped"
  ON public.commercial_callbacks FOR UPDATE TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR assigned_agent_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.commercial_callbacks TO authenticated;
