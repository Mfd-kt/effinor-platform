-- La catégorie commerciale affichée dérive désormais uniquement de la fiche CEE (workflow / leads.cee_sheet_id).
-- Ancienne source `leads.product_interest` : valeurs effacées pour éviter les incohérences avec la fiche réelle.

UPDATE public.leads
SET product_interest = NULL
WHERE product_interest IS NOT NULL;

COMMENT ON COLUMN public.leads.product_interest IS
  'DEPRECATED — non utilisé par l''ERP : catégorie = fiche CEE (cee_sheets via workflow ou leads.cee_sheet_id).';
