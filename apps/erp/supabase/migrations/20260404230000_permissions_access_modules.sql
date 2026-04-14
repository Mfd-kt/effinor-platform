-- =============================================================================
-- Permissions d’accès aux modules (bénéficiaires, opérations, documents, etc.)
-- Idempotent : ON CONFLICT + INSERT … ON CONFLICT DO NOTHING pour role_permissions.
-- =============================================================================

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

-- Super admin : toutes les perm d’accès (affichage matrice cohérent)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
  AND p.code LIKE 'perm.access.%'
ON CONFLICT DO NOTHING;

-- Périmètre « commercial élargi » + confirmateur : modules hors VT seuls
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

-- Agent + technicien : visites techniques (le reste filtré côté données / pas d’accès module)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.access.technical_visits'
WHERE r.code IN ('sales_agent', 'technician')
ON CONFLICT DO NOTHING;
