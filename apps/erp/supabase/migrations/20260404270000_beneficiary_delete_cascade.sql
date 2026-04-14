-- Suppression d’un bénéficiaire : cascade vers opérations (puis sites, installations, devis, factures, etc.)
-- et correction du conflit avec leads_conversion_consistency (SET NULL sur converted_beneficiary_id
-- interdit si converted_operation_id est encore renseigné).

CREATE OR REPLACE FUNCTION public.clear_leads_conversion_before_beneficiary_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.leads
  SET
    converted_operation_id = NULL,
    converted_beneficiary_id = NULL
  WHERE converted_beneficiary_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_clear_leads_conversion_before_beneficiary_delete ON public.beneficiaries;

CREATE TRIGGER trigger_clear_leads_conversion_before_beneficiary_delete
  BEFORE DELETE ON public.beneficiaries
  FOR EACH ROW
  EXECUTE PROCEDURE public.clear_leads_conversion_before_beneficiary_delete();

COMMENT ON FUNCTION public.clear_leads_conversion_before_beneficiary_delete() IS
  'Évite la violation de leads_conversion_consistency lors du ON DELETE SET NULL sur leads.converted_beneficiary_id.';

ALTER TABLE public.operations
  DROP CONSTRAINT IF EXISTS operations_beneficiary_id_fkey;

ALTER TABLE public.operations
  ADD CONSTRAINT operations_beneficiary_id_fkey
  FOREIGN KEY (beneficiary_id)
  REFERENCES public.beneficiaries (id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT operations_beneficiary_id_fkey ON public.operations IS
  'Suppression en cascade : opérations, puis (via FK existantes) sites, installations, devis, factures, documents liés opération, etc.';
