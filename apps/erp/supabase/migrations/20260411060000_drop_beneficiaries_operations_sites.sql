-- =============================================================================
-- Suppression profonde : beneficiaries, operations, operation_sites, operation_events
-- Détache les FK des tables conservées, puis DROP des tables et enums associés.
-- =============================================================================

-- ── Permissions (matrice + accès modules) ───────────────────────────────────
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE code IN (
    'perm.access.beneficiaries',
    'perm.beneficiaries.scope_all',
    'perm.beneficiaries.scope_creator',
    'perm.access.operations',
    'perm.operations.scope_all',
    'perm.operations.scope_creator',
    'perm.access.operation_sites',
    'perm.operation_sites.scope_all',
    'perm.operation_sites.scope_creator'
  )
  OR code LIKE 'perm.beneficiaries.%'
  OR code LIKE 'perm.operations.%'
  OR code LIKE 'perm.operation_sites.%'
);

DELETE FROM public.permissions
WHERE code IN (
  'perm.access.beneficiaries',
  'perm.beneficiaries.scope_all',
  'perm.beneficiaries.scope_creator',
  'perm.access.operations',
  'perm.operations.scope_all',
  'perm.operations.scope_creator',
  'perm.access.operation_sites',
  'perm.operation_sites.scope_all',
  'perm.operation_sites.scope_creator'
)
OR code LIKE 'perm.beneficiaries.%'
OR code LIKE 'perm.operations.%'
OR code LIKE 'perm.operation_sites.%';

-- ── Trigger / fonction liés à la suppression de bénéficiaires ─────────────────
DROP TRIGGER IF EXISTS trigger_clear_leads_conversion_before_beneficiary_delete ON public.beneficiaries;
DROP FUNCTION IF EXISTS public.clear_leads_conversion_before_beneficiary_delete();

-- ── Contrainte + colonnes leads (conversion) ────────────────────────────────
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_conversion_consistency;
ALTER TABLE public.leads DROP COLUMN IF EXISTS converted_beneficiary_id;
ALTER TABLE public.leads DROP COLUMN IF EXISTS converted_operation_id;

-- ── Colonnes FK vers operations / beneficiaries / operation_sites ─────────
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_at_least_one_parent;

ALTER TABLE public.documents
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS beneficiary_id,
  DROP COLUMN IF EXISTS operation_site_id;

ALTER TABLE public.installed_products
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS operation_site_id;

ALTER TABLE public.existing_heating_units
  DROP COLUMN IF EXISTS operation_site_id;

ALTER TABLE public.technical_studies
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS operation_site_id;

ALTER TABLE public.quotes
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS beneficiary_id;

ALTER TABLE public.invoices
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS beneficiary_id;

ALTER TABLE public.delegate_invoices
  DROP COLUMN IF EXISTS operation_id;

ALTER TABLE public.installations
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS operation_site_id;

ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS beneficiary_id;

ALTER TABLE public.email_threads
  DROP COLUMN IF EXISTS operation_id,
  DROP COLUMN IF EXISTS beneficiary_id;

ALTER TABLE public.technical_visits
  DROP COLUMN IF EXISTS beneficiary_id;

-- ── Tables dépendantes d’operations ─────────────────────────────────────────
DROP TABLE IF EXISTS public.operation_events CASCADE;
DROP TABLE IF EXISTS public.operation_sites CASCADE;
DROP TABLE IF EXISTS public.operations CASCADE;
DROP TABLE IF EXISTS public.beneficiaries CASCADE;

-- ── Enums devenus orphelins ─────────────────────────────────────────────────
DROP TYPE IF EXISTS public.operation_event_visibility;
DROP TYPE IF EXISTS public.operation_event_type;
DROP TYPE IF EXISTS public.site_kind;
DROP TYPE IF EXISTS public.operation_status;
DROP TYPE IF EXISTS public.beneficiary_status;
