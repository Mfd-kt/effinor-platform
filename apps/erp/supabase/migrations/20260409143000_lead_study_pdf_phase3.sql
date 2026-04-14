ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS study_media_files jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'study_pdf',
  title text NOT NULL,
  file_url text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'generated',
  template_version text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS lead_documents_lead_type_created_idx
  ON public.lead_documents (lead_id, document_type, created_at DESC);

ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_documents_authenticated_select ON public.lead_documents;
DROP POLICY IF EXISTS lead_documents_authenticated_insert ON public.lead_documents;

CREATE POLICY lead_documents_authenticated_select
  ON public.lead_documents
  FOR SELECT TO authenticated
  USING (public.is_active_profile());

CREATE POLICY lead_documents_authenticated_insert
  ON public.lead_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_profile());

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lead-studies', 'lead-studies', true, 20971520)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS lead_studies_select ON storage.objects;
DROP POLICY IF EXISTS lead_studies_insert ON storage.objects;
DROP POLICY IF EXISTS lead_studies_update ON storage.objects;
DROP POLICY IF EXISTS lead_studies_delete ON storage.objects;

CREATE POLICY lead_studies_select
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-studies');

CREATE POLICY lead_studies_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-studies');

CREATE POLICY lead_studies_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-studies')
  WITH CHECK (bucket_id = 'lead-studies');

CREATE POLICY lead_studies_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-studies');
