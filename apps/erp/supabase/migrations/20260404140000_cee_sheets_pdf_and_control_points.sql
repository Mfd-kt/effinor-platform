-- Fiches CEE : PDF officiel (Storage) + texte points de contrôle (contrôle dossier ultérieur).

ALTER TABLE public.cee_sheets
  ADD COLUMN official_pdf_path text,
  ADD COLUMN official_pdf_file_name text,
  ADD COLUMN control_points text;

COMMENT ON COLUMN public.cee_sheets.official_pdf_path IS
  'Chemin relatif dans le bucket Storage « cee-sheets » (ex. {uuid}/fiche.pdf).';
COMMENT ON COLUMN public.cee_sheets.official_pdf_file_name IS
  'Nom de fichier d’origine pour affichage.';
COMMENT ON COLUMN public.cee_sheets.control_points IS
  'Points de contrôle / critères pour vérifier le dossier (texte libre).';

-- Bucket : PDFs réservés aux utilisateurs authentifiés (réglages CEE = super admin côté app).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cee-sheets', 'cee-sheets', false, 20971520)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "cee_sheets_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "cee_sheets_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "cee_sheets_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "cee_sheets_storage_delete" ON storage.objects;

CREATE POLICY "cee_sheets_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cee-sheets');

CREATE POLICY "cee_sheets_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cee-sheets');

CREATE POLICY "cee_sheets_storage_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cee-sheets')
  WITH CHECK (bucket_id = 'cee-sheets');

CREATE POLICY "cee_sheets_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cee-sheets');
