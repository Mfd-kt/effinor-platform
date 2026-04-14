-- Installateur terrain : une installation n’est visible pour l’utilisateur assigné que via ce lien (app).

ALTER TABLE public.installations
  ADD COLUMN IF NOT EXISTS assigned_installer_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.installations.assigned_installer_user_id IS
  'Profil utilisateur désigné pour le suivi terrain : liste filtrée sur cet id pour le rôle installateur.';

CREATE INDEX IF NOT EXISTS idx_installations_assigned_installer_user_id
  ON public.installations (assigned_installer_user_id)
  WHERE assigned_installer_user_id IS NOT NULL;
