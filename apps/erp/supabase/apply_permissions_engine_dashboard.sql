-- =============================================================================
-- ATTENTION — script historique : insère encore de nombreuses permissions hors matrice.
-- Pour un référentiel propre (13 codes, 4 domaines), appliquer plutôt la migration
-- 20260404260000_permissions_cleanup_matrix_only.sql après les migrations du projet.
-- =============================================================================
-- À exécuter dans Supabase → SQL Editor (production ou local cloud)
-- Reprend les migrations 20260404210000 + 20260404220000, idempotentes.
-- =============================================================================

-- --- 20260404210000_technical_visits_created_by.sql ---
-- Auteur de la visite (pour le périmètre « confirmateur » : liste filtrée sur les VT créées).
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.technical_visits.created_by_user_id IS 'Profil ayant créé la fiche VT (contrôle d’accès confirmateur).';

CREATE INDEX IF NOT EXISTS idx_technical_visits_created_by_user_id
  ON public.technical_visits (created_by_user_id)
  WHERE deleted_at IS NULL;

-- --- 20260404220000_permissions_engine.sql ---
-- Permissions métier (configurables) — liées aux rôles via role_permissions
-- Idempotent : peut être relancé si les tables existent déjà (éditeur SQL / reprise).

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

-- --- 20260404230000_permissions_access_modules.sql ---
INSERT INTO public.permissions (code, label_fr, description)
VALUES
  (
    'perm.access.beneficiaries',
    'Accès : bénéficiaires',
    'Liste et fiches bénéficiaires.'
  ),
  (
    'perm.access.operations',
    'Accès : opérations',
    'Dossiers opération CEE et création.'
  ),
  (
    'perm.access.operation_sites',
    'Accès : sites d’opération',
    'Sites techniques rattachés aux opérations.'
  ),
  (
    'perm.access.documents',
    'Accès : documents',
    'Référentiel documentaire.'
  ),
  (
    'perm.access.existing_heating',
    'Accès : chauffage existant',
    'Équipements thermiques existants.'
  ),
  (
    'perm.access.installed_products',
    'Accès : produits installés',
    'Produits posés sur les chantiers.'
  ),
  (
    'perm.access.technical_studies',
    'Accès : études techniques',
    'Études et diagnostics liés aux opérations.'
  ),
  (
    'perm.access.quotes',
    'Accès : devis',
    'Devis et propositions commerciales.'
  ),
  (
    'perm.access.installations',
    'Accès : installations',
    'Suivi d’exécution terrain.'
  ),
  (
    'perm.access.products',
    'Accès : produits',
    'Catalogue produits / références.'
  ),
  (
    'perm.access.delegators',
    'Accès : délégataires',
    'Partenaires CEE et primes.'
  ),
  (
    'perm.access.invoices',
    'Accès : factures',
    'Facturation et paiements.'
  ),
  (
    'perm.access.technical_visits',
    'Accès : visites techniques',
    'Fiches VT et cartographie.'
  )
ON CONFLICT (code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
  AND p.code LIKE 'perm.access.%'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code IN (
  'perm.access.beneficiaries',
  'perm.access.operations',
  'perm.access.operation_sites',
  'perm.access.documents',
  'perm.access.existing_heating',
  'perm.access.installed_products',
  'perm.access.technical_studies',
  'perm.access.quotes',
  'perm.access.installations',
  'perm.access.products',
  'perm.access.delegators',
  'perm.access.invoices',
  'perm.access.technical_visits'
)
WHERE r.code IN ('admin', 'closer', 'sales_director', 'confirmer')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.access.technical_visits'
WHERE r.code IN ('sales_agent', 'technician')
ON CONFLICT DO NOTHING;

-- --- 20260404240000_permissions_table_scope_pairs.sql ---
INSERT INTO public.permissions (code, label_fr, description)
VALUES
  ('perm.beneficiaries.scope_all', 'Bénéficiaires : tout le périmètre', 'Voir et gérer tous les bénéficiaires.'),
  ('perm.beneficiaries.scope_creator', 'Bénéficiaires : périmètre créateur', 'Limiter au périmètre créateur (règles métier dans l’app).'),
  ('perm.leads.scope_creator', 'Leads : périmètre créateur (scope)', 'Équivalent « créés par l’agent » : perm.leads.scope_creator_agent.'),
  ('perm.operations.scope_all', 'Opérations : tout le périmètre', 'Toutes les opérations CEE.'),
  ('perm.operations.scope_creator', 'Opérations : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.operation_sites.scope_all', 'Sites d’opération : tout le périmètre', 'Tous les sites techniques.'),
  ('perm.operation_sites.scope_creator', 'Sites d’opération : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.documents.scope_all', 'Documents : tout le périmètre', 'Tous les documents du référentiel.'),
  ('perm.documents.scope_creator', 'Documents : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.technical_studies.scope_all', 'Études techniques : tout le périmètre', 'Toutes les études.'),
  ('perm.technical_studies.scope_creator', 'Études techniques : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.existing_heating.scope_all', 'Chauffage existant : tout le périmètre', 'Toutes les unités / fiches chauffage existant.'),
  ('perm.existing_heating.scope_creator', 'Chauffage existant : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.heating_models.scope_all', 'Modèles chauffage : tout le périmètre', 'Catalogue modèles thermiques.'),
  ('perm.heating_models.scope_creator', 'Modèles chauffage : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.products.scope_all', 'Produits : tout le périmètre', 'Catalogue produits complet.'),
  ('perm.products.scope_creator', 'Produits : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.installed_products.scope_all', 'Produits installés : tout le périmètre', 'Toutes les poses.'),
  ('perm.installed_products.scope_creator', 'Produits installés : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.technical_visits.scope_all', 'Visites techniques : tout le périmètre', 'Toutes les VT (sous réserve du périmètre leads).'),
  ('perm.technical_visits.scope_creator', 'Visites techniques : auteur / périmètre restreint', 'Limiter aux VT dont l’utilisateur est l’auteur (confirmateur).'),
  ('perm.delegators.scope_all', 'Délégataires : tout le périmètre', 'Tous les délégataires CEE.'),
  ('perm.delegators.scope_creator', 'Délégataires : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.cee_sheets.scope_all', 'Fiches CEE : tout le périmètre', 'Toutes les fiches CEE.'),
  ('perm.cee_sheets.scope_creator', 'Fiches CEE : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.lead_internal_notes.scope_all', 'Notes internes lead : tout le périmètre', 'Toutes les notes.'),
  ('perm.lead_internal_notes.scope_creator', 'Notes internes lead : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.quotes.scope_all', 'Devis : tout le périmètre', 'Tous les devis (module).'),
  ('perm.quotes.scope_creator', 'Devis : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.installations.scope_all', 'Installations : tout le périmètre', 'Toutes les installations (module).'),
  ('perm.installations.scope_creator', 'Installations : périmètre créateur', 'Limiter au périmètre créateur.'),
  ('perm.invoices.scope_all', 'Factures : tout le périmètre', 'Toutes les factures (module).'),
  ('perm.invoices.scope_creator', 'Factures : périmètre créateur', 'Limiter au périmètre créateur.')
ON CONFLICT (code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
  AND (p.code LIKE '%.scope_all' OR p.code LIKE '%.scope_creator')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code LIKE '%.scope_all'
WHERE r.code IN ('admin', 'closer', 'sales_director')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code LIKE '%.scope_all' AND p.code <> 'perm.technical_visits.scope_all'
WHERE r.code = 'confirmer'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.technical_visits.scope_creator'
WHERE r.code = 'confirmer'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code IN (
  'perm.leads.scope_creator',
  'perm.leads.scope_creator_agent',
  'perm.technical_visits.scope_all'
)
WHERE r.code = 'sales_agent'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.technical_visits.scope_all'
WHERE r.code = 'technician'
ON CONFLICT DO NOTHING;
