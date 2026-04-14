-- Un seul référentiel : les anciennes lignes public.polluters sont fusionnées dans public.delegators, puis polluteurs est supprimé.

-- 1) Même nom (insensible à la casse / espaces) : enrichir le délégataire existant
UPDATE public.delegators d
SET
  company_name = COALESCE(d.company_name, p.company_name),
  siret = COALESCE(d.siret, p.siret),
  address = COALESCE(d.address, p.address),
  notes = CASE
    WHEN p.notes IS NULL OR trim(p.notes) = '' THEN d.notes
    WHEN d.notes IS NULL OR trim(d.notes) = '' THEN p.notes
    ELSE trim(d.notes) || E'\n\n---\n' || trim(p.notes)
  END,
  control_points = COALESCE(d.control_points, p.control_points),
  official_pdf_path = COALESCE(d.official_pdf_path, p.official_pdf_path),
  official_pdf_file_name = COALESCE(d.official_pdf_file_name, p.official_pdf_file_name),
  updated_at = GREATEST(d.updated_at, p.updated_at)
FROM public.polluters p
WHERE d.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND lower(trim(d.name)) = lower(trim(p.name));

-- 2) Pollueurs sans délégataire du même nom : insérer comme délégataire (id conservé pour chemins Storage existants)
INSERT INTO public.delegators (
  id,
  name,
  company_name,
  email,
  phone,
  contact_name,
  contact_phone,
  contact_email,
  siret,
  address,
  contract_start_date,
  invoice_note,
  notes,
  official_pdf_path,
  official_pdf_file_name,
  control_points,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  p.id,
  p.name,
  p.company_name,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  p.siret,
  p.address,
  NULL,
  NULL,
  p.notes,
  p.official_pdf_path,
  p.official_pdf_file_name,
  p.control_points,
  p.created_at,
  p.updated_at,
  p.deleted_at
FROM public.polluters p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.delegators d
    WHERE d.deleted_at IS NULL
      AND lower(trim(d.name)) = lower(trim(p.name))
  );

DROP TABLE IF EXISTS public.polluters;

COMMENT ON TABLE public.delegators IS
  'Délégataires CEE (référentiel unique : partenaires, obligés, opérations, facturation).';
