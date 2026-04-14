-- Notes internes sur les leads (plusieurs entrées, auteur + horodatage).

CREATE TABLE public.lead_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_internal_notes_body_nonempty CHECK (length(trim(body)) > 0)
);

CREATE INDEX idx_lead_internal_notes_lead_id_created_at
  ON public.lead_internal_notes (lead_id, created_at DESC);

COMMENT ON TABLE public.lead_internal_notes IS 'Notes internes : texte, auteur (profil) et date de création.';

ALTER TABLE public.lead_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_internal_notes_all_active"
  ON public.lead_internal_notes FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

-- Migration des anciennes notes libres (une note par lead si auteur connu).
INSERT INTO public.lead_internal_notes (lead_id, body, created_by)
SELECT
  l.id,
  trim(l.qualification_notes),
  COALESCE(l.confirmed_by_user_id, l.created_by_agent_id)
FROM public.leads l
WHERE l.qualification_notes IS NOT NULL
  AND trim(l.qualification_notes) <> ''
  AND COALESCE(l.confirmed_by_user_id, l.created_by_agent_id) IS NOT NULL;

ALTER TABLE public.leads DROP COLUMN qualification_notes;
