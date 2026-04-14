-- Annuaire interne : les utilisateurs actifs peuvent lire les profils actifs (affichage agent créateur,
-- confirmateur, listes déroulantes, etc.). La politique « own » reste pour la cohérence ; les politiques
-- SELECT sont combinées en OU.
CREATE POLICY "profiles_select_active_directory"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND deleted_at IS NULL
    AND is_active = true
  );

COMMENT ON POLICY "profiles_select_active_directory" ON public.profiles IS
  'Lecture des fiches profil actives pour affichage métier (jointures leads, VT, etc.).';
