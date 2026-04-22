-- =============================================================================
-- Refonte des rôles : nouveau workflow EFFINOR
-- =============================================================================
-- 1. Ajout de 3 nouveaux rôles : admin_agent, installer, daf
-- 2. Migration des utilisateurs 'confirmer' vers 'closer'
-- 3. Suppression du rôle 'confirmer' (devenu obsolète)
-- 4. Suppression des permissions cee_workflows obsolètes
-- 5. Le rôle lead_generation_quantifier est conservé
-- =============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ajout des 3 nouveaux rôles
-- ----------------------------------------------------------------------------

INSERT INTO public.roles (code, label_fr)
VALUES
  ('admin_agent', 'Agent administratif'),
  ('installer', 'Installateur'),
  ('daf', 'Directeur administratif et financier')
ON CONFLICT (code) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. Migration des utilisateurs 'confirmer' → 'closer'
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  confirmer_role_id uuid;
  closer_role_id uuid;
BEGIN
  SELECT id INTO confirmer_role_id FROM public.roles WHERE code = 'confirmer';
  SELECT id INTO closer_role_id FROM public.roles WHERE code = 'closer';

  IF confirmer_role_id IS NOT NULL AND closer_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT ur.user_id, closer_role_id
    FROM public.user_roles ur
    WHERE ur.role_id = confirmer_role_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur2
        WHERE ur2.user_id = ur.user_id
          AND ur2.role_id = closer_role_id
      );

    DELETE FROM public.user_roles WHERE role_id = confirmer_role_id;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. Suppression du rôle 'confirmer'
-- ----------------------------------------------------------------------------

DELETE FROM public.role_permissions
WHERE role_id IN (SELECT id FROM public.roles WHERE code = 'confirmer');

DELETE FROM public.roles WHERE code = 'confirmer';


-- ----------------------------------------------------------------------------
-- 4. Suppression des permissions cee_workflows obsolètes
-- ----------------------------------------------------------------------------

DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE code IN (
    'perm.access.cee_workflows',
    'perm.cee_workflows.scope_all',
    'perm.cee_workflows.scope_team',
    'perm.cee_workflows.manage_teams'
  )
);

DELETE FROM public.permissions
WHERE code IN (
  'perm.access.cee_workflows',
  'perm.cee_workflows.scope_all',
  'perm.cee_workflows.scope_team',
  'perm.cee_workflows.manage_teams'
);


-- ----------------------------------------------------------------------------
-- 5. Ajout des nouvelles permissions
-- ----------------------------------------------------------------------------

INSERT INTO public.permissions (code, label_fr)
VALUES
  ('perm.access.admin_module', 'Accès module administratif (documents, dossiers CEE)'),
  ('perm.access.installer_module', 'Accès module installateur (chantiers)'),
  ('perm.access.finance_module', 'Accès module finance (paiements, trésorerie)'),
  ('perm.installations.scope_assigned', 'Chantiers assignés uniquement')
ON CONFLICT (code) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 6. Attribution des permissions aux nouveaux rôles
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  admin_agent_role_id uuid;
  installer_role_id uuid;
  daf_role_id uuid;
  perm_admin uuid;
  perm_installer uuid;
  perm_finance uuid;
  perm_tv_access uuid;
  perm_install_access uuid;
  perm_install_assigned uuid;
  perm_leads_all uuid;
BEGIN
  SELECT id INTO admin_agent_role_id FROM public.roles WHERE code = 'admin_agent';
  SELECT id INTO installer_role_id FROM public.roles WHERE code = 'installer';
  SELECT id INTO daf_role_id FROM public.roles WHERE code = 'daf';

  SELECT id INTO perm_admin FROM public.permissions WHERE code = 'perm.access.admin_module';
  SELECT id INTO perm_installer FROM public.permissions WHERE code = 'perm.access.installer_module';
  SELECT id INTO perm_finance FROM public.permissions WHERE code = 'perm.access.finance_module';
  SELECT id INTO perm_tv_access FROM public.permissions WHERE code = 'perm.access.technical_visits';
  SELECT id INTO perm_install_access FROM public.permissions WHERE code = 'perm.access.installations';
  SELECT id INTO perm_install_assigned FROM public.permissions WHERE code = 'perm.installations.scope_assigned';
  SELECT id INTO perm_leads_all FROM public.permissions WHERE code = 'perm.leads.scope_all';

  IF admin_agent_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES
      (admin_agent_role_id, perm_admin),
      (admin_agent_role_id, perm_tv_access),
      (admin_agent_role_id, perm_install_access),
      (admin_agent_role_id, perm_leads_all)
    ON CONFLICT DO NOTHING;
  END IF;

  IF installer_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES
      (installer_role_id, perm_installer),
      (installer_role_id, perm_install_access),
      (installer_role_id, perm_install_assigned)
    ON CONFLICT DO NOTHING;
  END IF;

  IF daf_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES
      (daf_role_id, perm_finance),
      (daf_role_id, perm_leads_all),
      (daf_role_id, perm_install_access)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


COMMIT;
