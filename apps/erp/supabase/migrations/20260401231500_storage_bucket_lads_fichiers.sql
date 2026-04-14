-- Bucket créé côté UI ou ici : fichiers médias des leads (aligné sur NEXT_PUBLIC_SUPABASE_LEAD_MEDIA_BUCKET).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('Lads_fichiers', 'Lads_fichiers', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "lead_files_lads_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lead_files_lads_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lead_files_lads_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "lead_files_lads_delete_authenticated" ON storage.objects;

CREATE POLICY "lead_files_lads_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'Lads_fichiers');

CREATE POLICY "lead_files_lads_select_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'Lads_fichiers');

CREATE POLICY "lead_files_lads_update_authenticated"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'Lads_fichiers')
  WITH CHECK (bucket_id = 'Lads_fichiers');

CREATE POLICY "lead_files_lads_delete_authenticated"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'Lads_fichiers');
