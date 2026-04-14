-- Référentiels CEE : fiches et pollueurs (réglages).

CREATE TABLE public.cee_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT cee_sheets_code_nonempty CHECK (length(trim(code)) > 0),
  CONSTRAINT cee_sheets_label_nonempty CHECK (length(trim(label)) > 0)
);

CREATE UNIQUE INDEX idx_cee_sheets_code_lower_active
  ON public.cee_sheets (lower(trim(code)))
  WHERE deleted_at IS NULL;

COMMENT ON TABLE public.cee_sheets IS 'Catalogue de fiches CEE (codes) pour sélection opérations.';
CREATE INDEX idx_cee_sheets_deleted_at ON public.cee_sheets (deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE public.polluters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  siret text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT polluters_name_nonempty CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE public.polluters IS 'Pollueurs / obligés CEE (référentiel).';
CREATE INDEX idx_polluters_deleted_at ON public.polluters (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER set_cee_sheets_updated_at
  BEFORE UPDATE ON public.cee_sheets FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_polluters_updated_at
  BEFORE UPDATE ON public.polluters FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.cee_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polluters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cee_sheets_all_active"
  ON public.cee_sheets FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "polluters_all_active"
  ON public.polluters FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
