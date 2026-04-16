-- Traçabilité des actions « affecter / remplacer par le technicien recommandé » (formulaire VT).
CREATE TABLE IF NOT EXISTS public.technical_visit_assignment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_visit_id uuid NULL REFERENCES public.technical_visits (id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN (
      'apply_recommended_assignment',
      'replace_with_recommended_assignment'
    )
  ),
  context text NOT NULL CHECK (context IN ('create', 'edit')),
  actor_user_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  previous_technician_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  recommended_technician_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  applied_technician_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  recommendation_score numeric NULL,
  home_distance_km numeric NULL,
  same_day_distance_km numeric NULL,
  recommendation_reason text NULL,
  validation_status text NOT NULL CHECK (
    validation_status IN (
      'applied',
      'validated_for_form',
      'rejected_stale',
      'rejected_no_recommendation',
      'rejected_not_eligible',
      'rejected_invalid_context',
      'rejected_already_recommended',
      'rejected_form_technician_already_set',
      'rejected_unauthorized'
    )
  ),
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technical_visit_assignment_logs_visit_created
  ON public.technical_visit_assignment_logs (technical_visit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_technical_visit_assignment_logs_actor_created
  ON public.technical_visit_assignment_logs (actor_user_id, created_at DESC);

COMMENT ON TABLE public.technical_visit_assignment_logs IS
  'Journal des tentatives d''affectation via recommandation serveur (VT), succès et rejets.';

ALTER TABLE public.technical_visit_assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visit_assignment_logs_select_authenticated"
  ON public.technical_visit_assignment_logs FOR SELECT TO authenticated
  USING (public.is_active_profile());

CREATE POLICY "technical_visit_assignment_logs_insert_authenticated"
  ON public.technical_visit_assignment_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_active_profile());
