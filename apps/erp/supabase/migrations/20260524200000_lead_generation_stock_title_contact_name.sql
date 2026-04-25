-- =============================================================================
-- lead_generation_stock — colonnes manquantes title + contact_name
-- =============================================================================
-- Les mappers PAP (`apps/erp/features/lead-generation/apify/sources/pap/map-item.ts`)
-- et LBC (`apps/erp/features/lead-generation/apify/sources/leboncoin-immobilier/map-item.ts`)
-- alimentent ces deux champs depuis la première version. La migration
-- `20260502100000_add_immobilier_columns_to_stock.sql` les avait oubliés,
-- ce qui faisait planter silencieusement chaque insert (PostgREST renvoyait
-- "Could not find the 'contact_name' column" → 0 ligne insérée → tout
-- compté comme doublon).
-- =============================================================================

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS contact_name text;

COMMENT ON COLUMN public.lead_generation_stock.title IS
  'Titre brut de l''annonce (LBC, PAP). Utilisé pour debug et UI.';
COMMENT ON COLUMN public.lead_generation_stock.contact_name IS
  'Nom du contact particulier (PAP) ou seller_name si non-pro (LBC).';
