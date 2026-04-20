-- Les quantificateurs lead gen doivent rattacher chaque import à une équipe CEE sans être
-- membres de ces équipes. La politique SELECT historique ne les autorisait pas : ils voyaient
-- les fiches (cee_sheets) mais aucune ligne dans cee_sheet_teams → sélecteur d’équipe vide.

DROP POLICY IF EXISTS "cee_sheet_teams_select_scoped" ON public.cee_sheet_teams;

CREATE POLICY "cee_sheet_teams_select_scoped"
  ON public.cee_sheet_teams FOR SELECT TO authenticated
  USING (
    public.is_active_profile()
    AND (
      public.current_user_can_manage_cee_workflows()
      OR public.current_user_is_member_of_cee_sheet_team(id)
      OR (
        public.current_user_has_role_code('lead_generation_quantifier')
        AND is_active = true
      )
    )
  );

COMMENT ON POLICY "cee_sheet_teams_select_scoped" ON public.cee_sheet_teams IS
  'Lecture : direction / admin CEE, membre de l’équipe, ou quantificateur lead gen (équipes actives uniquement pour ce rôle).';
