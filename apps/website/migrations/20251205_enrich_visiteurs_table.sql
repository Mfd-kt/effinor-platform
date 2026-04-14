-- Étape 1 : enrichir la table visiteurs

ALTER TABLE public.visiteurs
  -- Source / marketing
  ADD COLUMN IF NOT EXISTS referrer_url   text,
  ADD COLUMN IF NOT EXISTS utm_source     text,
  ADD COLUMN IF NOT EXISTS utm_medium     text,
  ADD COLUMN IF NOT EXISTS utm_campaign   text,
  ADD COLUMN IF NOT EXISTS utm_content    text,
  ADD COLUMN IF NOT EXISTS utm_term       text,

  -- Pages clés
  ADD COLUMN IF NOT EXISTS landing_page   text,
  ADD COLUMN IF NOT EXISTS exit_page      text,

  -- Appareil / navigateur (décodés)
  ADD COLUMN IF NOT EXISTS browser_name    text,
  ADD COLUMN IF NOT EXISTS browser_version text,
  ADD COLUMN IF NOT EXISTS os              text,
  ADD COLUMN IF NOT EXISTS device_type     text,  -- 'desktop' | 'mobile' | 'tablet'

  -- Comportement & conversion
  ADD COLUMN IF NOT EXISTS is_new_visitor  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS conversion_at   timestamptz,
  ADD COLUMN IF NOT EXISTS events          jsonb;

-- Index utiles pour le temps réel et les listes
CREATE INDEX IF NOT EXISTS visiteurs_last_seen_idx
  ON public.visiteurs (last_seen DESC);

CREATE INDEX IF NOT EXISTS visiteurs_session_idx
  ON public.visiteurs (session_id);

CREATE INDEX IF NOT EXISTS visiteurs_created_at_idx
  ON public.visiteurs (created_at DESC);

