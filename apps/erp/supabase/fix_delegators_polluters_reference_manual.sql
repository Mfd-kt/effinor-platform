-- =============================================================================
-- Si colonnes manquantes sur delegators + bucket reference-docs
-- (équivalent migration 20260404150000).
-- La table polluteurs a été fusionnée dans delegators (migration 20260404160000).
-- Idempotent.
-- =============================================================================

ALTER TABLE public.delegators
  ADD COLUMN IF NOT EXISTS official_pdf_path text;

ALTER TABLE public.delegators
  ADD COLUMN IF NOT EXISTS official_pdf_file_name text;

ALTER TABLE public.delegators
  ADD COLUMN IF NOT EXISTS control_points text;

ALTER TABLE public.delegators
  ADD COLUMN IF NOT EXISTS prime_per_kwhc_note text;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reference-docs', 'reference-docs', false, 20971520)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reference_docs_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "reference_docs_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reference_docs_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "reference_docs_storage_delete" ON storage.objects;

CREATE POLICY "reference_docs_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reference-docs');

CREATE POLICY "reference_docs_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reference-docs');

CREATE POLICY "reference_docs_storage_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reference-docs')
  WITH CHECK (bucket_id = 'reference-docs');

CREATE POLICY "reference_docs_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reference-docs');
