-- Médias lead : tableaux d’URLs (storage public ou liens hérités) au lieu d’un seul texte.

ALTER TABLE public.leads
  ADD COLUMN aerial_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN cadastral_parcel_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN recording_files jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.leads SET
  aerial_photos = CASE
    WHEN aerial_photo_url IS NOT NULL AND btrim(aerial_photo_url::text) <> ''
    THEN jsonb_build_array(btrim(aerial_photo_url::text))
    ELSE '[]'::jsonb
  END,
  cadastral_parcel_files = CASE
    WHEN cadastral_parcel_image_url IS NOT NULL AND btrim(cadastral_parcel_image_url::text) <> ''
    THEN jsonb_build_array(btrim(cadastral_parcel_image_url::text))
    ELSE '[]'::jsonb
  END,
  recording_files = CASE
    WHEN recording_url IS NOT NULL AND btrim(recording_url::text) <> ''
    THEN jsonb_build_array(btrim(recording_url::text))
    ELSE '[]'::jsonb
  END;

ALTER TABLE public.leads
  DROP COLUMN aerial_photo_url,
  DROP COLUMN cadastral_parcel_image_url,
  DROP COLUMN recording_url;

COMMENT ON COLUMN public.leads.aerial_photos IS 'URLs publiques (storage) des photos aériennes — tableau JSON.';
COMMENT ON COLUMN public.leads.cadastral_parcel_files IS 'URLs publiques (storage) parcelle cadastrale — tableau JSON.';
COMMENT ON COLUMN public.leads.recording_files IS 'URLs publiques (storage) enregistrements audio — tableau JSON.';

-- Bucket Storage (fichiers sous leads/{lead_id}/…)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lead-media', 'lead-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "lead_media_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-media');

CREATE POLICY "lead_media_select_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-media');

CREATE POLICY "lead_media_update_authenticated"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-media')
  WITH CHECK (bucket_id = 'lead-media');

CREATE POLICY "lead_media_delete_authenticated"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-media');
