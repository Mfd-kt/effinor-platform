-- Digests intelligents par rôle : historique, déduplication, audit.

CREATE TABLE IF NOT EXISTS public.role_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_target text NOT NULL
    CONSTRAINT role_digests_role_target_check CHECK (
      role_target IN ('agent', 'confirmateur', 'closer', 'manager', 'direction')
    ),
  target_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  digest_type text NOT NULL DEFAULT 'in_app'
    CONSTRAINT role_digests_digest_type_check CHECK (
      digest_type IN ('in_app', 'morning', 'midday', 'evening', 'crisis')
    ),
  priority text NOT NULL DEFAULT 'normal'
    CONSTRAINT role_digests_priority_check CHECK (
      priority IN ('low', 'normal', 'high', 'critical')
    ),
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'generated'
    CONSTRAINT role_digests_status_check CHECK (
      status IN ('generated', 'delivered', 'suppressed', 'read')
    ),
  generated_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_role_digests_user_generated
  ON public.role_digests (target_user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_digests_dedupe_lookup
  ON public.role_digests (target_user_id, role_target, dedupe_key, generated_at DESC);

COMMENT ON TABLE public.role_digests IS 'Digests générés par rôle (in-app V1) — dédup par dedupe_key.';

CREATE TABLE IF NOT EXISTS public.role_digest_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id uuid REFERENCES public.role_digests (id) ON DELETE CASCADE,
  event_type text NOT NULL
    CONSTRAINT role_digest_logs_event_type_check CHECK (
      event_type IN ('generated', 'suppressed_duplicate', 'delivered', 'read', 'error')
    ),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_digest_logs_digest_created
  ON public.role_digest_logs (digest_id, created_at DESC);

COMMENT ON TABLE public.role_digest_logs IS 'Audit des événements digest.';

ALTER TABLE public.role_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_digest_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_digests_select_own_or_direction" ON public.role_digests;
CREATE POLICY "role_digests_select_own_or_direction"
  ON public.role_digests FOR SELECT TO authenticated
  USING (
    target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'sales_director')
    )
  );

DROP POLICY IF EXISTS "role_digests_insert_own" ON public.role_digests;
CREATE POLICY "role_digests_insert_own"
  ON public.role_digests FOR INSERT TO authenticated
  WITH CHECK (target_user_id = auth.uid());

DROP POLICY IF EXISTS "role_digests_update_own" ON public.role_digests;
CREATE POLICY "role_digests_update_own"
  ON public.role_digests FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

DROP POLICY IF EXISTS "role_digest_logs_select_scoped" ON public.role_digest_logs;
CREATE POLICY "role_digest_logs_select_scoped"
  ON public.role_digest_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.role_digests d
      WHERE d.id = role_digest_logs.digest_id
        AND (
          d.target_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.code IN ('super_admin', 'sales_director')
          )
        )
    )
  );

DROP POLICY IF EXISTS "role_digest_logs_insert_own_digest" ON public.role_digest_logs;
CREATE POLICY "role_digest_logs_insert_own_digest"
  ON public.role_digest_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.role_digests d
      WHERE d.id = role_digest_logs.digest_id
        AND d.target_user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.role_digests TO authenticated;
GRANT SELECT, INSERT ON public.role_digest_logs TO authenticated;
