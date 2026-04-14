-- =============================================================================
-- Pour chaque entité métier : perm.<table>.scope_all et perm.<table>.scope_creator
-- Idempotent (ON CONFLICT). Complète perm.leads.* et perm.technical_visits.* existants.
-- =============================================================================

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

-- Super admin : toutes les permissions scope_all / scope_creator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
  AND (p.code LIKE '%.scope_all' OR p.code LIKE '%.scope_creator')
ON CONFLICT DO NOTHING;

-- Direction commerciale : tout le périmètre (scope_all) sur chaque table
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code LIKE '%.scope_all'
WHERE r.code IN ('admin', 'closer', 'sales_director')
ON CONFLICT DO NOTHING;

-- Confirmateur : tout scope_all sauf visites techniques (remplacé par scope_creator sur VT)
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

-- Agent : leads créateur + VT « tout périmètre module » (filtrage par leads côté app)
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

-- Technicien : VT tout périmètre au niveau permission (liste souvent vide côté leads)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.permissions p ON p.code = 'perm.technical_visits.scope_all'
WHERE r.code = 'technician'
ON CONFLICT DO NOTHING;
