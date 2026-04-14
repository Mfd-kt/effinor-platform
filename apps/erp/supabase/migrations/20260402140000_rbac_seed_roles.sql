-- =============================================================================
-- RBAC — rôles métier (codes stables pour l’app Next.js)
-- =============================================================================

INSERT INTO public.roles (code, label_fr)
VALUES
  ('super_admin', 'Super administrateur'),
  ('sales_agent', 'Agent commercial'),
  ('confirmer', 'Confirmateur'),
  ('closer', 'Closer'),
  ('sales_director', 'Directeur commercial')
ON CONFLICT (code) DO UPDATE
SET label_fr = EXCLUDED.label_fr;

COMMENT ON COLUMN public.roles.code IS 'Identifiant technique : super_admin, sales_agent, confirmer, closer, sales_director';
