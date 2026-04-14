-- E-mail de premier contact à la création d’un rappel commercial (garde-fous + suivi optionnel)
ALTER TABLE public.commercial_callbacks
  ADD COLUMN IF NOT EXISTS initial_contact_email_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.commercial_callbacks.initial_contact_email_sent IS
  'Si true, l’e-mail de confirmation « premier contact » suivant la création a déjà été envoyé (idempotence).';

ALTER TABLE public.email_tracking
  ADD COLUMN IF NOT EXISTS commercial_callback_id uuid REFERENCES public.commercial_callbacks (id) ON DELETE SET NULL;

ALTER TABLE public.email_tracking
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_email_tracking_commercial_callback_id
  ON public.email_tracking (commercial_callback_id)
  WHERE commercial_callback_id IS NOT NULL;

COMMENT ON COLUMN public.email_tracking.commercial_callback_id IS
  'Rappel commercial associé (e-mail premier contact), si pas de lead.';
