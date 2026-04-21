-- Cycle de vie explicite des comptes utilisateurs.
-- active: compte opérationnel
-- paused: gel temporaire (réactivable)
-- disabled: sortie définitive (non réactivable)
-- deleted: suppression opérationnelle forte (masqué, non réactivable)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_lifecycle_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_lifecycle_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_lifecycle_status_check CHECK (
    account_lifecycle_status IN ('active', 'paused', 'disabled', 'deleted')
  );

-- Backfill conservateur à partir de l'existant.
UPDATE public.profiles
SET account_lifecycle_status = CASE
  WHEN deleted_at IS NOT NULL THEN 'deleted'
  WHEN is_active IS TRUE THEN 'active'
  ELSE 'paused'
END
WHERE account_lifecycle_status NOT IN ('active', 'paused', 'disabled', 'deleted');

COMMENT ON COLUMN public.profiles.account_lifecycle_status IS
  'État métier du compte: active, paused, disabled, deleted.';

