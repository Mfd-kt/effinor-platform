-- =============================================================================
-- Effinor ERP V1 — Initial schema (PostgreSQL / Supabase)
-- PHASE 2 — enums, tables, FKs, indexes, constraints, triggers, RLS base
-- =============================================================================

-- Extensions (Supabase usually has these; IF NOT EXISTS keeps idempotent runs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.lead_source AS ENUM (
  'website',
  'landing_froid',
  'landing_lum',
  'landing_destrat',
  'lead_generation',
  'hpf',
  'kompas',
  'site_internet',
  'prospecting_kompas',
  'phone',
  'partner',
  'referral',
  'other'
);

CREATE TYPE public.lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'nurturing',
  'lost',
  'converted'
);

CREATE TYPE public.qualification_status AS ENUM (
  'pending',
  'in_progress',
  'qualified',
  'disqualified'
);

CREATE TYPE public.beneficiary_status AS ENUM (
  'prospect',
  'active',
  'inactive',
  'blocked'
);

CREATE TYPE public.operation_status AS ENUM (
  'draft',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
  'archived'
);

CREATE TYPE public.sales_status AS ENUM (
  'draft',
  'to_contact',
  'qualified',
  'proposal',
  'quote_sent',
  'quote_signed',
  'won',
  'lost',
  'stalled'
);

CREATE TYPE public.admin_status AS ENUM (
  'pending',
  'in_review',
  'complete',
  'blocked',
  'archived'
);

CREATE TYPE public.technical_status AS ENUM (
  'pending',
  'study_in_progress',
  'validated',
  'blocked'
);

CREATE TYPE public.site_kind AS ENUM (
  'warehouse',
  'office',
  'greenhouse',
  'industrial',
  'retail',
  'mixed',
  'other'
);

CREATE TYPE public.document_type AS ENUM (
  'quote',
  'invoice',
  'delegate_invoice',
  'technical_study',
  'dimensioning_note',
  'cee_declaration',
  'photo',
  'contract',
  'proof',
  'correspondence',
  'other'
);

CREATE TYPE public.document_status AS ENUM (
  'draft',
  'pending_review',
  'valid',
  'rejected',
  'superseded'
);

CREATE TYPE public.quote_status AS ENUM (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'superseded'
);

CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'issued',
  'partial',
  'paid',
  'cancelled',
  'overdue'
);

CREATE TYPE public.delegate_invoice_status AS ENUM (
  'draft',
  'submitted',
  'paid',
  'disputed',
  'cancelled'
);

CREATE TYPE public.installation_status AS ENUM (
  'planned',
  'in_progress',
  'done',
  'cancelled'
);

CREATE TYPE public.task_type AS ENUM (
  'call',
  'email',
  'visit',
  'admin',
  'follow_up',
  'technical',
  'other'
);

CREATE TYPE public.task_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TYPE public.task_status AS ENUM (
  'open',
  'in_progress',
  'done',
  'cancelled'
);

CREATE TYPE public.operation_event_type AS ENUM (
  'status_change',
  'document',
  'comment',
  'assignment',
  'validation',
  'quote',
  'invoice',
  'lead_conversion',
  'system',
  'other'
);

CREATE TYPE public.operation_event_visibility AS ENUM (
  'internal',
  'external'
);

CREATE TYPE public.line_item_type AS ENUM (
  'product',
  'service',
  'discount',
  'other'
);

CREATE TYPE public.email_direction AS ENUM (
  'inbound',
  'outbound'
);

CREATE TYPE public.product_family AS ENUM (
  'lighting_led',
  'destratification',
  'balancing',
  'heat_recovery',
  'other'
);

-- =============================================================================
-- CORE: roles (no dependency on profiles)
-- =============================================================================

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label_fr text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'RBAC role definitions; referenced by user_roles and RLS helpers.';

-- =============================================================================
-- profiles (application profile linked to auth.users)
-- =============================================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  job_title text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT profiles_email_format CHECK (length(trim(email)) > 0)
);

CREATE INDEX idx_profiles_deleted_at ON public.profiles (deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.profiles IS 'One row per auth user; id = auth.users.id.';

-- =============================================================================
-- user_roles
-- =============================================================================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles (role_id);

-- =============================================================================
-- delegators
-- =============================================================================

CREATE TABLE public.delegators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  email text,
  phone text,
  contact_name text,
  contact_phone text,
  contact_email text,
  siret text,
  address text,
  contract_start_date date,
  invoice_note text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_delegators_deleted_at ON public.delegators (deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- beneficiaries
-- =============================================================================

CREATE TABLE public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  siren text,
  siret_head_office text,
  siret_worksite text,
  civility text,
  contact_first_name text,
  contact_last_name text,
  contact_role text,
  phone text,
  landline text,
  email text,
  head_office_address text,
  head_office_postal_code text,
  head_office_city text,
  worksite_address text,
  worksite_postal_code text,
  worksite_city text,
  climate_zone text,
  region text,
  acquisition_source text,
  sales_owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  confirmer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  status public.beneficiary_status NOT NULL DEFAULT 'prospect',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_beneficiaries_sales_owner_id ON public.beneficiaries (sales_owner_id);
CREATE INDEX idx_beneficiaries_confirmer_id ON public.beneficiaries (confirmer_id);
CREATE INDEX idx_beneficiaries_status ON public.beneficiaries (status);
CREATE INDEX idx_beneficiaries_deleted_at ON public.beneficiaries (deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- leads (conversion FKs to operations added after operations table exists)
-- =============================================================================

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.lead_source NOT NULL,
  campaign text,
  landing text,
  product_interest text,
  company_name text NOT NULL,
  siren text,
  siret text,
  contact_first_name text,
  contact_last_name text,
  contact_role text,
  phone text,
  email text,
  worksite_address text,
  postal_code text,
  city text,
  building_type text,
  surface_m2 numeric(14, 2),
  ceiling_height_m numeric(10, 2),
  heating_type text,
  lead_status public.lead_status NOT NULL DEFAULT 'new',
  qualification_status public.qualification_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  callback_at timestamptz,
  notes text,
  score numeric(10, 2),
  converted_beneficiary_id uuid REFERENCES public.beneficiaries (id) ON DELETE SET NULL,
  converted_operation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT leads_conversion_consistency CHECK (
    converted_operation_id IS NULL OR converted_beneficiary_id IS NOT NULL
  )
);

CREATE INDEX idx_leads_source ON public.leads (source);
CREATE INDEX idx_leads_lead_status ON public.leads (lead_status);
CREATE INDEX idx_leads_assigned_to ON public.leads (assigned_to);
CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX idx_leads_deleted_at ON public.leads (deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- operations
-- =============================================================================

CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_reference text NOT NULL UNIQUE,
  beneficiary_id uuid NOT NULL REFERENCES public.beneficiaries (id) ON DELETE RESTRICT,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  cee_sheet_code text NOT NULL,
  product_family public.product_family,
  title text NOT NULL,
  operation_status public.operation_status NOT NULL DEFAULT 'draft',
  sales_status public.sales_status NOT NULL DEFAULT 'draft',
  admin_status public.admin_status NOT NULL DEFAULT 'pending',
  technical_status public.technical_status NOT NULL DEFAULT 'pending',
  delegator_id uuid REFERENCES public.delegators (id) ON DELETE SET NULL,
  sales_owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  confirmer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  admin_owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  technical_owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  technical_visit_date timestamptz,
  quote_sent_at timestamptz,
  quote_signed_at timestamptz,
  installation_start_at timestamptz,
  installation_end_at timestamptz,
  deposit_date timestamptz,
  prime_paid_at timestamptz,
  estimated_quote_amount_ht numeric(14, 2),
  estimated_prime_amount numeric(14, 2),
  estimated_remaining_cost numeric(14, 2),
  valuation_amount numeric(14, 2),
  drive_url text,
  signature_url text,
  public_tracking_url text,
  ai_summary text,
  risk_level text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_operations_beneficiary_id ON public.operations (beneficiary_id);
CREATE INDEX idx_operations_lead_id ON public.operations (lead_id);
CREATE INDEX idx_operations_delegator_id ON public.operations (delegator_id);
CREATE INDEX idx_operations_operation_status ON public.operations (operation_status);
CREATE INDEX idx_operations_sales_status ON public.operations (sales_status);
CREATE INDEX idx_operations_created_at ON public.operations (created_at DESC);
CREATE INDEX idx_operations_deleted_at ON public.operations (deleted_at) WHERE deleted_at IS NULL;

-- Back-fill leads.converted_operation_id FK
ALTER TABLE public.leads
  ADD CONSTRAINT leads_converted_operation_id_fkey
  FOREIGN KEY (converted_operation_id) REFERENCES public.operations (id) ON DELETE SET NULL;

CREATE INDEX idx_leads_converted_operation_id ON public.leads (converted_operation_id);

-- =============================================================================
-- operation_sites
-- =============================================================================

CREATE TABLE public.operation_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  label text NOT NULL,
  sequence_number integer,
  is_primary boolean NOT NULL DEFAULT false,
  site_kind public.site_kind,
  activity_type text,
  building_type text,
  dedicated_building text,
  climate_zone text,
  operating_mode text,
  height_m numeric(12, 4),
  volume_m3 numeric(16, 4),
  area_m2 numeric(14, 2),
  flow_type text,
  heating_system_type text,
  convective_power_kw numeric(14, 4),
  radiant_power_kw numeric(14, 4),
  calculated_power_kw numeric(14, 4),
  air_flow_required_m3h numeric(16, 4),
  destratifier_quantity_required integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_operation_sites_operation_id ON public.operation_sites (operation_id);
CREATE INDEX idx_operation_sites_deleted_at ON public.operation_sites (deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- documents (central repository; attach to at least one business entity)
-- =============================================================================

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid REFERENCES public.operations (id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES public.beneficiaries (id) ON DELETE CASCADE,
  operation_site_id uuid REFERENCES public.operation_sites (id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  document_subtype text,
  version integer NOT NULL DEFAULT 1,
  document_status public.document_status NOT NULL DEFAULT 'draft',
  is_required boolean NOT NULL DEFAULT false,
  is_signed_by_client boolean NOT NULL DEFAULT false,
  is_signed_by_company boolean NOT NULL DEFAULT false,
  is_compliant boolean,
  issued_at timestamptz,
  signed_at timestamptz,
  checked_at timestamptz,
  checked_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  document_number text,
  document_date date,
  amount_ht numeric(14, 2),
  amount_ttc numeric(14, 2),
  mime_type text,
  file_size_bytes bigint,
  storage_bucket text,
  storage_path text,
  signed_storage_bucket text,
  signed_storage_path text,
  signature_provider_url text,
  internal_comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT documents_at_least_one_parent CHECK (
    operation_id IS NOT NULL
    OR beneficiary_id IS NOT NULL
    OR operation_site_id IS NOT NULL
  )
);

CREATE INDEX idx_documents_operation_id ON public.documents (operation_id);
CREATE INDEX idx_documents_beneficiary_id ON public.documents (beneficiary_id);
CREATE INDEX idx_documents_operation_site_id ON public.documents (operation_site_id);
CREATE INDEX idx_documents_document_type ON public.documents (document_type);
CREATE INDEX idx_documents_document_status ON public.documents (document_status);
CREATE INDEX idx_documents_deleted_at ON public.documents (deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.documents IS 'Single document repository; official PDFs referenced via primary_document_id from finance/study tables.';

-- =============================================================================
-- products
-- =============================================================================

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  reference text NOT NULL,
  name text NOT NULL,
  description text,
  noise_db numeric(10, 2),
  airflow_m3h numeric(16, 4),
  max_throw numeric(12, 4),
  unit_power_w numeric(14, 4),
  luminous_efficiency numeric(10, 4),
  cri integer,
  unit_price_ht numeric(14, 2),
  valuation numeric(14, 2),
  product_family public.product_family,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT products_brand_reference_unique UNIQUE (brand, reference)
);

CREATE INDEX idx_products_product_family ON public.products (product_family);
CREATE INDEX idx_products_deleted_at ON public.products (deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- installed_products
-- =============================================================================

CREATE TABLE public.installed_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  operation_site_id uuid REFERENCES public.operation_sites (id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity numeric(14, 4) NOT NULL,
  unit_price_ht numeric(14, 2),
  total_price_ht numeric(14, 2),
  unit_power_w numeric(14, 4),
  cee_sheet_code text,
  cumac_amount numeric(16, 4),
  valuation_amount numeric(14, 2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installed_products_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_installed_products_operation_id ON public.installed_products (operation_id);
CREATE INDEX idx_installed_products_operation_site_id ON public.installed_products (operation_site_id);
CREATE INDEX idx_installed_products_product_id ON public.installed_products (product_id);

-- =============================================================================
-- heating_models & existing_heating_units
-- =============================================================================

CREATE TABLE public.heating_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  type text NOT NULL,
  energy text,
  power_kw numeric(14, 4),
  use_case text,
  technical_sheet_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT heating_models_brand_model_unique UNIQUE (brand, model)
);

CREATE TABLE public.existing_heating_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_site_id uuid NOT NULL REFERENCES public.operation_sites (id) ON DELETE CASCADE,
  heating_model_id uuid NOT NULL REFERENCES public.heating_models (id) ON DELETE RESTRICT,
  quantity numeric(14, 4) NOT NULL DEFAULT 1,
  unit_power_kw numeric(14, 4),
  total_power_kw numeric(14, 4),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT existing_heating_units_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_existing_heating_units_operation_site_id ON public.existing_heating_units (operation_site_id);
CREATE INDEX idx_existing_heating_units_heating_model_id ON public.existing_heating_units (heating_model_id);

-- =============================================================================
-- technical_studies (NDD => study_type dimensioning_note)
-- =============================================================================

CREATE TYPE public.study_type AS ENUM (
  'dimensioning_note',
  'lighting_study',
  'technical_assessment',
  'cold_recovery_study',
  'other'
);

CREATE TYPE public.technical_study_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'rejected',
  'archived'
);

CREATE TABLE public.technical_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  operation_site_id uuid REFERENCES public.operation_sites (id) ON DELETE SET NULL,
  study_type public.study_type NOT NULL,
  reference text NOT NULL,
  status public.technical_study_status NOT NULL DEFAULT 'draft',
  study_date date,
  engineering_office text,
  summary text,
  primary_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technical_studies_operation_id ON public.technical_studies (operation_id);
CREATE INDEX idx_technical_studies_operation_site_id ON public.technical_studies (operation_site_id);
CREATE INDEX idx_technical_studies_primary_document_id ON public.technical_studies (primary_document_id);

-- =============================================================================
-- quotes & quote_lines
-- =============================================================================

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES public.beneficiaries (id) ON DELETE RESTRICT,
  quote_number text NOT NULL UNIQUE,
  issue_date date NOT NULL,
  validity_date date,
  status public.quote_status NOT NULL DEFAULT 'draft',
  currency_code char(3) NOT NULL DEFAULT 'EUR',
  issue_year integer NOT NULL,
  amount_ht numeric(14, 2) NOT NULL,
  vat_rate numeric(6, 4) NOT NULL DEFAULT 0.2,
  amount_ttc numeric(14, 2) NOT NULL,
  estimated_prime_amount numeric(14, 2),
  remaining_cost_amount numeric(14, 2),
  primary_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  signed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_issue_year_range CHECK (issue_year >= 2000 AND issue_year <= 2100)
);

CREATE INDEX idx_quotes_operation_id ON public.quotes (operation_id);
CREATE INDEX idx_quotes_beneficiary_id ON public.quotes (beneficiary_id);
CREATE INDEX idx_quotes_status ON public.quotes (status);
CREATE INDEX idx_quotes_primary_document_id ON public.quotes (primary_document_id);

CREATE TABLE public.quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  line_type public.line_item_type NOT NULL DEFAULT 'product',
  label text NOT NULL,
  description text,
  quantity numeric(14, 4) NOT NULL,
  unit_price_ht numeric(14, 2) NOT NULL,
  total_price_ht numeric(14, 2) NOT NULL,
  installed_product_id uuid REFERENCES public.installed_products (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_lines_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_quote_lines_quote_id ON public.quote_lines (quote_id);
CREATE INDEX idx_quote_lines_installed_product_id ON public.quote_lines (installed_product_id);

-- =============================================================================
-- invoices & invoice_lines
-- =============================================================================

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES public.beneficiaries (id) ON DELETE RESTRICT,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  currency_code char(3) NOT NULL DEFAULT 'EUR',
  issue_year integer NOT NULL,
  amount_ht numeric(14, 2) NOT NULL,
  vat_rate numeric(6, 4) NOT NULL DEFAULT 0.2,
  amount_ttc numeric(14, 2) NOT NULL,
  paid_at timestamptz,
  payment_method text,
  primary_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_issue_year_range CHECK (issue_year >= 2000 AND issue_year <= 2100)
);

CREATE INDEX idx_invoices_operation_id ON public.invoices (operation_id);
CREATE INDEX idx_invoices_beneficiary_id ON public.invoices (beneficiary_id);
CREATE INDEX idx_invoices_status ON public.invoices (status);
CREATE INDEX idx_invoices_primary_document_id ON public.invoices (primary_document_id);

CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  line_type public.line_item_type NOT NULL DEFAULT 'product',
  label text NOT NULL,
  description text,
  quantity numeric(14, 4) NOT NULL,
  unit_price_ht numeric(14, 2) NOT NULL,
  total_price_ht numeric(14, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_lines_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines (invoice_id);

-- =============================================================================
-- delegate_invoices
-- =============================================================================

CREATE TABLE public.delegate_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id uuid NOT NULL REFERENCES public.delegators (id) ON DELETE RESTRICT,
  operation_id uuid REFERENCES public.operations (id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL,
  status public.delegate_invoice_status NOT NULL DEFAULT 'draft',
  currency_code char(3) NOT NULL DEFAULT 'EUR',
  issue_year integer NOT NULL,
  amount_ht numeric(14, 2) NOT NULL,
  vat_rate numeric(6, 4) NOT NULL DEFAULT 0.2,
  amount_ttc numeric(14, 2) NOT NULL,
  exchange_reference text,
  primary_document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delegate_invoices_issue_year_range CHECK (issue_year >= 2000 AND issue_year <= 2100)
);

CREATE INDEX idx_delegate_invoices_delegator_id ON public.delegate_invoices (delegator_id);
CREATE INDEX idx_delegate_invoices_operation_id ON public.delegate_invoices (operation_id);
CREATE INDEX idx_delegate_invoices_primary_document_id ON public.delegate_invoices (primary_document_id);

-- =============================================================================
-- installations
-- =============================================================================

CREATE TABLE public.installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  operation_site_id uuid REFERENCES public.operation_sites (id) ON DELETE SET NULL,
  team_name text,
  subcontractor_name text,
  start_date date,
  end_date date,
  technician_count integer,
  status public.installation_status NOT NULL DEFAULT 'planned',
  travel_cost numeric(14, 2),
  hotel_cost numeric(14, 2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_installations_operation_id ON public.installations (operation_id);
CREATE INDEX idx_installations_operation_site_id ON public.installations (operation_site_id);

-- =============================================================================
-- tasks
-- =============================================================================

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type public.task_type NOT NULL DEFAULT 'other',
  priority public.task_priority NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'open',
  due_date timestamptz,
  assigned_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  operation_id uuid REFERENCES public.operations (id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES public.beneficiaries (id) ON DELETE CASCADE,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_user_id ON public.tasks (assigned_user_id);
CREATE INDEX idx_tasks_operation_id ON public.tasks (operation_id);
CREATE INDEX idx_tasks_beneficiary_id ON public.tasks (beneficiary_id);
CREATE INDEX idx_tasks_status ON public.tasks (status);
CREATE INDEX idx_tasks_due_date ON public.tasks (due_date);

-- =============================================================================
-- operation_events
-- =============================================================================

CREATE TABLE public.operation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations (id) ON DELETE CASCADE,
  event_type public.operation_event_type NOT NULL,
  label text NOT NULL,
  description text,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  visibility public.operation_event_visibility NOT NULL DEFAULT 'internal',
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operation_events_operation_id_created_at ON public.operation_events (operation_id, created_at DESC);
CREATE INDEX idx_operation_events_event_type ON public.operation_events (event_type);

-- =============================================================================
-- email_threads & emails
-- =============================================================================

CREATE TABLE public.email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid REFERENCES public.operations (id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES public.beneficiaries (id) ON DELETE CASCADE,
  subject text NOT NULL,
  external_provider_id text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_threads_operation_id ON public.email_threads (operation_id);
CREATE INDEX idx_email_threads_beneficiary_id ON public.email_threads (beneficiary_id);

CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.email_threads (id) ON DELETE CASCADE,
  direction public.email_direction NOT NULL,
  from_address text NOT NULL,
  to_addresses text NOT NULL,
  sent_at timestamptz,
  body_text text,
  raw_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_thread_id ON public.emails (thread_id);
CREATE INDEX idx_emails_sent_at ON public.emails (sent_at DESC);

-- =============================================================================
-- Triggers: updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at (excluding operation_events, emails)
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_delegators_updated_at
  BEFORE UPDATE ON public.delegators FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_operations_updated_at
  BEFORE UPDATE ON public.operations FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_operation_sites_updated_at
  BEFORE UPDATE ON public.operation_sites FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_installed_products_updated_at
  BEFORE UPDATE ON public.installed_products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_heating_models_updated_at
  BEFORE UPDATE ON public.heating_models FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_existing_heating_units_updated_at
  BEFORE UPDATE ON public.existing_heating_units FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_technical_studies_updated_at
  BEFORE UPDATE ON public.technical_studies FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_quote_lines_updated_at
  BEFORE UPDATE ON public.quote_lines FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_invoice_lines_updated_at
  BEFORE UPDATE ON public.invoice_lines FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_delegate_invoices_updated_at
  BEFORE UPDATE ON public.delegate_invoices FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_installations_updated_at
  BEFORE UPDATE ON public.installations FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- Auth: auto-create profile on signup (Supabase standard pattern)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(COALESCE(NEW.email, '')), ''),
      'user-' || NEW.id::text || '@pending.local'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user@pending.local'), '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- RLS helpers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_active_profile()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.deleted_at IS NULL
      AND p.is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_active_profile IS 'True if current user has a non-deleted active profile row.';

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heating_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.existing_heating_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- roles: any authenticated user can read role catalogue
CREATE POLICY "roles_select_authenticated"
  ON public.roles FOR SELECT TO authenticated
  USING (true);

-- profiles: users manage their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles: visible if active internal user (same baseline as other tables)
CREATE POLICY "user_roles_all_active"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

-- Default ERP baseline: active internal users can CRUD all business data
-- Tighten per-table in later migrations (ownership, delegator scoping, etc.)

CREATE POLICY "delegators_all_active"
  ON public.delegators FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "beneficiaries_all_active"
  ON public.beneficiaries FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "leads_all_active"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "operations_all_active"
  ON public.operations FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "operation_sites_all_active"
  ON public.operation_sites FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "documents_all_active"
  ON public.documents FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "products_all_active"
  ON public.products FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "installed_products_all_active"
  ON public.installed_products FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "heating_models_all_active"
  ON public.heating_models FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "existing_heating_units_all_active"
  ON public.existing_heating_units FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "technical_studies_all_active"
  ON public.technical_studies FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "quotes_all_active"
  ON public.quotes FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "quote_lines_all_active"
  ON public.quote_lines FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "invoices_all_active"
  ON public.invoices FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "invoice_lines_all_active"
  ON public.invoice_lines FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "delegate_invoices_all_active"
  ON public.delegate_invoices FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "installations_all_active"
  ON public.installations FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "tasks_all_active"
  ON public.tasks FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "operation_events_all_active"
  ON public.operation_events FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "email_threads_all_active"
  ON public.email_threads FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "emails_all_active"
  ON public.emails FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

-- Privileges: Supabase grants schema/table access to `authenticated` by default.
GRANT EXECUTE ON FUNCTION public.is_active_profile() TO authenticated;

-- service_role bypasses RLS by default in Supabase
