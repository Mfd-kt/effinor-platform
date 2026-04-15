-- =============================================================================
-- Notes vocales terrain + transcription (stockage séparé de form_answers_json).
-- =============================================================================

CREATE TABLE public.technical_visit_audio_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_visit_id uuid NOT NULL REFERENCES public.technical_visits (id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  audio_storage_path text,
  audio_public_url text,
  mime_type text NOT NULL,
  duration_seconds double precision,
  transcription_text text,
  transcription_status text NOT NULL DEFAULT 'uploading'
    CONSTRAINT technical_visit_audio_notes_tx_status_check CHECK (
      transcription_status IN ('uploading', 'uploaded', 'transcribing', 'transcribed', 'failed')
    ),
  transcription_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technical_visit_audio_notes_storage_when_ready CHECK (
    transcription_status = 'uploading'
    OR (audio_storage_path IS NOT NULL AND audio_public_url IS NOT NULL)
  )
);

COMMENT ON TABLE public.technical_visit_audio_notes IS
  'Enregistrements audio terrain liés à une VT ; transcription automatique (OpenAI) côté serveur.';
COMMENT ON COLUMN public.technical_visit_audio_notes.transcription_status IS
  'uploading → transcribing → transcribed | failed';

CREATE INDEX idx_technical_visit_audio_notes_visit_id
  ON public.technical_visit_audio_notes (technical_visit_id);
CREATE INDEX idx_technical_visit_audio_notes_created_at
  ON public.technical_visit_audio_notes (technical_visit_id, created_at DESC);

CREATE TRIGGER set_technical_visit_audio_notes_updated_at
  BEFORE UPDATE ON public.technical_visit_audio_notes FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.technical_visit_audio_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visit_audio_notes_all_active"
  ON public.technical_visit_audio_notes FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
