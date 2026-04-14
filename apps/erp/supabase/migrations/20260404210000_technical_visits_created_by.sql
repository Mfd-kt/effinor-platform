-- Auteur de la visite (pour le périmètre « confirmateur » : liste filtrée sur les VT créées).
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.technical_visits.created_by_user_id IS 'Profil ayant créé la fiche VT (contrôle d’accès confirmateur).';

CREATE INDEX IF NOT EXISTS idx_technical_visits_created_by_user_id
  ON public.technical_visits (created_by_user_id)
  WHERE deleted_at IS NULL;
