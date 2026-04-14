-- Référentiel permissions : uniquement les 14 codes de la matrice (4 domaines).
-- Supprime les liaisons rôle → permission puis les lignes hors matrice.

DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE code NOT IN (
    'perm.leads.scope_all',
    'perm.leads.scope_creator',
    'perm.leads.scope_creator_agent',
    'perm.access.technical_visits',
    'perm.technical_visits.scope_all',
    'perm.technical_visits.scope_creator',
    'perm.technical_visits.creator_only',
    'perm.access.beneficiaries',
    'perm.beneficiaries.scope_all',
    'perm.beneficiaries.scope_creator',
    'perm.access.installations',
    'perm.installations.scope_all',
    'perm.installations.scope_creator'
  )
);

DELETE FROM public.permissions
WHERE code NOT IN (
  'perm.leads.scope_all',
  'perm.leads.scope_creator',
  'perm.leads.scope_creator_agent',
  'perm.access.technical_visits',
  'perm.technical_visits.scope_all',
  'perm.technical_visits.scope_creator',
  'perm.technical_visits.creator_only',
  'perm.access.beneficiaries',
  'perm.beneficiaries.scope_all',
  'perm.beneficiaries.scope_creator',
  'perm.access.installations',
  'perm.installations.scope_all',
  'perm.installations.scope_creator'
);

INSERT INTO public.permissions (code, label_fr, description)
VALUES
  ('perm.leads.scope_all', 'Leads : tout le portefeuille', 'Voir tous les leads autorisés par le rôle.'),
  ('perm.leads.scope_creator', 'Leads : périmètre créateur', 'Leads dont l’utilisateur est le créateur (agent).'),
  ('perm.leads.scope_creator_agent', 'Leads : créés par l’agent', 'Synonyme historique du périmètre créateur.'),
  ('perm.access.technical_visits', 'Accès : visites techniques', 'Listes et fiches visites techniques.'),
  ('perm.technical_visits.scope_all', 'Visites techniques : tout le périmètre', 'Toutes les VT visibles dans le périmètre leads.'),
  ('perm.technical_visits.scope_creator', 'Visites techniques : auteur / restreint', 'Uniquement les VT dont l’utilisateur est l’auteur.'),
  ('perm.technical_visits.creator_only', 'Visites techniques : auteur uniquement', 'Ne lister que les VT créées par l’utilisateur.'),
  ('perm.access.beneficiaries', 'Accès : bénéficiaires', 'Listes et fiches bénéficiaires.'),
  ('perm.beneficiaries.scope_all', 'Bénéficiaires : tout le périmètre', 'Voir et gérer tous les bénéficiaires.'),
  ('perm.beneficiaries.scope_creator', 'Bénéficiaires : périmètre créateur', 'Bénéficiaires dont l’utilisateur est le commercial assigné ou le flux lié.'),
  ('perm.access.installations', 'Accès : installations', 'Module installations terrain.'),
  ('perm.installations.scope_all', 'Installations : tout le périmètre', 'Toutes les installations.'),
  ('perm.installations.scope_creator', 'Installations : restreint', 'Installations assignées à l’utilisateur (installateur).')
ON CONFLICT (code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;
