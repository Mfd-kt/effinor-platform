-- Délégataires & pollueurs : même modèle que les fiches CEE (PDF + points de contrôle).

ALTER TABLE public.delegators
  ADD COLUMN official_pdf_path text,
  ADD COLUMN official_pdf_file_name text,
  ADD COLUMN control_points text;

COMMENT ON COLUMN public.delegators.official_pdf_path IS
  'Chemin dans le bucket Storage « reference-docs » (ex. delegators/{id}/….pdf).';
COMMENT ON COLUMN public.delegators.official_pdf_file_name IS 'Nom de fichier d’origine.';
COMMENT ON COLUMN public.delegators.control_points IS 'Points de contrôle dossier (texte libre).';

ALTER TABLE public.polluters
  ADD COLUMN official_pdf_path text,
  ADD COLUMN official_pdf_file_name text,
  ADD COLUMN control_points text;

COMMENT ON COLUMN public.polluters.official_pdf_path IS
  'Chemin dans le bucket Storage « reference-docs » (ex. polluters/{id}/….pdf).';
COMMENT ON COLUMN public.polluters.official_pdf_file_name IS 'Nom de fichier d’origine.';
COMMENT ON COLUMN public.polluters.control_points IS 'Points de contrôle dossier (texte libre).';

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
