CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  provider text NOT NULL DEFAULT 'smtp',
  error text,
  source_module text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_type_created_at
  ON public.email_events (email_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_events_recipient_created_at
  ON public.email_events (recipient_email, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_password_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_password_setup_tokens_not_expired_after_create CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_user_password_setup_tokens_user_id
  ON public.user_password_setup_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_user_password_setup_tokens_expires_at
  ON public.user_password_setup_tokens (expires_at);

COMMENT ON TABLE public.email_events IS
  'Journal centralisé des envois e-mail (orchestrateur).';

COMMENT ON TABLE public.user_password_setup_tokens IS
  'Jetons temporaires de définition de mot de passe initial (aucun mot de passe en clair par e-mail).';
