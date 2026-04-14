-- Permettre l’audit « suppressed_duplicate » sans ligne role_digests (digest_id NULL).

DROP POLICY IF EXISTS "role_digest_logs_insert_suppressed_own" ON public.role_digest_logs;
CREATE POLICY "role_digest_logs_insert_suppressed_own"
  ON public.role_digest_logs FOR INSERT TO authenticated
  WITH CHECK (
    digest_id IS NULL
    AND event_type = 'suppressed_duplicate'
    AND coalesce(payload_json->>'target_user_id', '') = auth.uid()::text
  );
