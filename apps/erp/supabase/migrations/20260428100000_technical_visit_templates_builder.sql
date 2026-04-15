-- =============================================================================
-- Builder no-code : templates de visite technique (master + versions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.technical_visit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cee_sheet_id uuid REFERENCES public.cee_sheets (id) ON DELETE SET NULL,
  template_key text NOT NULL,
  label text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technical_visit_templates_key_nonempty CHECK (length(trim(template_key)) > 0),
  CONSTRAINT technical_visit_templates_label_nonempty CHECK (length(trim(label)) > 0),
  CONSTRAINT technical_visit_templates_template_key_unique UNIQUE (template_key)
);

CREATE INDEX IF NOT EXISTS idx_technical_visit_templates_cee_sheet_id
  ON public.technical_visit_templates (cee_sheet_id)
  WHERE cee_sheet_id IS NOT NULL;

COMMENT ON TABLE public.technical_visit_templates IS
  'Référentiel métier des gabarits VT créés via le builder (hors registry code).';
COMMENT ON COLUMN public.technical_visit_templates.cee_sheet_id IS
  'Métadonnée / filtre UX ; la liaison runtime reste cee_sheets.technical_visit_template_key.';

CREATE TABLE IF NOT EXISTS public.technical_visit_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.technical_visit_templates (id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  schema_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT technical_visit_template_versions_status_chk CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  CONSTRAINT technical_visit_template_versions_version_positive CHECK (version_number > 0),
  CONSTRAINT technical_visit_template_versions_unique_num UNIQUE (template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_tv_template_versions_template_id
  ON public.technical_visit_template_versions (template_id);
CREATE INDEX IF NOT EXISTS idx_tv_template_versions_published_lookup
  ON public.technical_visit_template_versions (template_id, version_number)
  WHERE status = 'published';

COMMENT ON TABLE public.technical_visit_template_versions IS
  'Versions draft / publiées / archivées ; schema_json aligné sur VisitTemplateSchema.';

CREATE TRIGGER set_technical_visit_templates_updated_at
  BEFORE UPDATE ON public.technical_visit_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_technical_visit_template_versions_updated_at
  BEFORE UPDATE ON public.technical_visit_template_versions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE FUNCTION public.technical_visit_template_versions_immutable_published()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    IF NEW.schema_json IS DISTINCT FROM OLD.schema_json
       OR NEW.version_number IS DISTINCT FROM OLD.version_number
       OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
      RAISE EXCEPTION 'technical_visit_template_versions: published row is immutable (schema/version/template_id).';
    END IF;
    IF NEW.status = 'draft' THEN
      RAISE EXCEPTION 'technical_visit_template_versions: cannot revert published to draft.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER technical_visit_template_versions_immutable_published_trg
  BEFORE UPDATE ON public.technical_visit_template_versions
  FOR EACH ROW EXECUTE PROCEDURE public.technical_visit_template_versions_immutable_published();

ALTER TABLE public.technical_visit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_visit_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visit_templates_all_active"
  ON public.technical_visit_templates FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "technical_visit_template_versions_all_active"
  ON public.technical_visit_template_versions FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
