-- =============================================================================
-- Permissions métier (configurables) — liées aux rôles via role_permissions
-- Idempotent : peut être relancé si les tables existent déjà (éditeur SQL / reprise).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label_fr text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.permissions IS 'Capacités fines référencées par l’application (union par rôle utilisateur).';

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions (permission_id);

COMMENT ON TABLE public.role_permissions IS 'Attribution rôle → permissions (modifiable en base sans déployer le code).';

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permissions_select_authenticated" ON public.permissions;
CREATE POLICY "permissions_select_authenticated"
  ON public.permissions FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "role_permissions_select_authenticated" ON public.role_permissions;
CREATE POLICY "role_permissions_select_authenticated"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

-- Référentiel des codes (aligné sur lib/auth/permission-codes.ts)
INSERT INTO public.permissions (code, label_fr, description)
VALUES
  (
    'perm.leads.scope_all',
    'Leads : tout le portefeuille',
    'Voir tous les leads (le confirmateur seul, admin, direction, etc.). La combinaison agent + confirmateur reste gérée à part dans le code.'
  ),
  (
    'perm.leads.scope_creator_agent',
    'Leads : créés par l’agent',
    'Leads dont l’utilisateur est l’agent créateur.'
  ),
  (
    'perm.technical_visits.creator_only',
    'Visites techniques : auteur uniquement',
    'Ne lister que les VT dont l’utilisateur est l’auteur (created_by_user_id).'
  )
ON CONFLICT (code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;

-- Attribution par code de rôle (idempotent)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.leads.scope_all'
WHERE r.code IN ('super_admin', 'admin', 'closer', 'sales_director')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.leads.scope_creator_agent'
WHERE r.code = 'sales_agent'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.leads.scope_all'
WHERE r.code = 'confirmer'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.technical_visits.creator_only'
WHERE r.code = 'confirmer'
ON CONFLICT DO NOTHING;
