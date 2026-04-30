-- =============================================================================
-- PHASE 2.2.5 — Centralisation contrôle accès extensions leads
-- =============================================================================
--
-- CONTEXTE
-- La policy initiale (Phase 2.1) sur leads_b2b / leads_b2c /
-- lead_activity_events utilise un EXISTS direct vers leads.
-- Cette migration introduit la fonction auth_can_access_lead(uuid)
-- qui CENTRALISE la logique d'accès et permet un durcissement
-- futur sans toucher aux 3 policies.
--
-- PORTÉE DE CETTE MIGRATION
-- La fonction reproduit le comportement actuel (tout profil actif
-- accédant à un lead existant). Pas de changement effectif sur
-- la sécurité.
--
-- DURCISSEMENT FUTUR (Phase 3 sécurité, hors scope chantier B2B/B2C)
-- Le périmètre fin par rôle (technician via VT, sales_agent via
-- création, lead_generation_quantifier via batch, etc.) sera
-- implémenté plus tard, en touchant uniquement cette fonction.
-- Au moment du durcissement, vérifier la cohérence avec
-- canAccessLeadRow dans apps/erp/lib/auth/lead-scope.ts.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_can_access_lead(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    auth.uid() IS NOT NULL
    AND public.is_active_profile()
    AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = p_lead_id
    );
$$;

COMMENT ON FUNCTION public.auth_can_access_lead(uuid) IS
  'Centralise le contrôle d''accès en lecture/écriture aux extensions '
  'leads_b2b, leads_b2c et au journal lead_activity_events. '
  'Comportement actuel : équivalent à la policy initiale '
  '(is_active_profile + EXISTS lead). '
  'Durcissement prévu en Phase 3 sécurité : aligner sur la matrice '
  'des permissions par rôle (technician via VT, sales_agent via '
  'created_by_agent_id, etc.) en restant cohérent avec '
  'canAccessLeadRow / getLeadScopeForAccess (apps/erp/lib/auth/lead-scope.ts). '
  'SECURITY DEFINER + search_path fixé : indispensable pour permettre '
  'aux policies des extensions d''utiliser cette fonction sans risque '
  'de path injection.';

GRANT EXECUTE ON FUNCTION public.auth_can_access_lead(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- Mise à jour des policies pour utiliser la fonction
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "leads_b2b_all_active" ON public.leads_b2b;
CREATE POLICY "leads_b2b_all_active"
  ON public.leads_b2b FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND public.auth_can_access_lead(leads_b2b.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND public.auth_can_access_lead(leads_b2b.lead_id)
  );

DROP POLICY IF EXISTS "leads_b2c_all_active" ON public.leads_b2c;
CREATE POLICY "leads_b2c_all_active"
  ON public.leads_b2c FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND public.auth_can_access_lead(leads_b2c.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND public.auth_can_access_lead(leads_b2c.lead_id)
  );

DROP POLICY IF EXISTS "lead_activity_events_all_active" ON public.lead_activity_events;
CREATE POLICY "lead_activity_events_all_active"
  ON public.lead_activity_events FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND public.auth_can_access_lead(lead_activity_events.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND public.auth_can_access_lead(lead_activity_events.lead_id)
  );

COMMIT;

-- =============================================================================
-- Tests post-déploiement (manuel)
-- =============================================================================
-- 
-- -- Test 1 : un user authentifié actif voit les extensions
-- -- d'un lead existant
-- SELECT public.auth_can_access_lead(
--   '1a946cda-3bba-41cb-b83d-65fdeb3c679a'::uuid
-- );
-- -- Attendu : true (pour Moufdi connecté)
-- 
-- -- Test 2 : un lead inexistant retourne false
-- SELECT public.auth_can_access_lead(
--   '00000000-0000-0000-0000-000000000000'::uuid
-- );
-- -- Attendu : false
-- 
-- =============================================================================
