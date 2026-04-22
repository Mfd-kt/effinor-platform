-- Étape lead-generation : ajout des colonnes immobilières issues du connecteur
-- clearpath/leboncoin-immobilier (source = 'leboncoin_immobilier').
-- Toutes les colonnes textuelles / numériques sont nullable pour ne pas casser
-- les batches existants (CSV manuel, autres sources futures).
-- is_professional est NOT NULL avec DEFAULT false (cohérent avec le ciblage CEE).

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS source_url       text,
  ADD COLUMN IF NOT EXISTS is_professional  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS property_type    text,
  ADD COLUMN IF NOT EXISTS surface_m2       integer,
  ADD COLUMN IF NOT EXISTS land_surface_m2  integer,
  ADD COLUMN IF NOT EXISTS rooms            integer,
  ADD COLUMN IF NOT EXISTS bedrooms         integer,
  ADD COLUMN IF NOT EXISTS dpe_class        text,
  ADD COLUMN IF NOT EXISTS ges_class        text,
  ADD COLUMN IF NOT EXISTS price_eur        integer,
  ADD COLUMN IF NOT EXISTS latitude         numeric,
  ADD COLUMN IF NOT EXISTS longitude        numeric,
  ADD COLUMN IF NOT EXISTS department_name  text,
  ADD COLUMN IF NOT EXISTS region_name      text,
  ADD COLUMN IF NOT EXISTS published_at     timestamptz;

COMMENT ON COLUMN public.lead_generation_stock.source_url       IS 'URL publique de l''annonce / fiche d''origine.';
COMMENT ON COLUMN public.lead_generation_stock.is_professional  IS 'Vendeur professionnel (true) ou particulier (false). Default false (cible CEE = particuliers).';
COMMENT ON COLUMN public.lead_generation_stock.property_type    IS 'Type de bien (Maison, Appartement, Terrain, Parking, Autre).';
COMMENT ON COLUMN public.lead_generation_stock.surface_m2       IS 'Surface habitable en m².';
COMMENT ON COLUMN public.lead_generation_stock.land_surface_m2  IS 'Surface du terrain en m² (si applicable).';
COMMENT ON COLUMN public.lead_generation_stock.rooms            IS 'Nombre total de pièces.';
COMMENT ON COLUMN public.lead_generation_stock.bedrooms         IS 'Nombre de chambres.';
COMMENT ON COLUMN public.lead_generation_stock.dpe_class        IS 'Classe DPE (A à G, V vierge, N non applicable).';
COMMENT ON COLUMN public.lead_generation_stock.ges_class        IS 'Classe GES (A à G, V vierge, N non applicable).';
COMMENT ON COLUMN public.lead_generation_stock.price_eur        IS 'Prix affiché en euros entiers (vente ou loyer mensuel selon catégorie).';
COMMENT ON COLUMN public.lead_generation_stock.latitude         IS 'Latitude GPS (WGS84).';
COMMENT ON COLUMN public.lead_generation_stock.longitude        IS 'Longitude GPS (WGS84).';
COMMENT ON COLUMN public.lead_generation_stock.department_name  IS 'Nom du département (renvoyé par la source).';
COMMENT ON COLUMN public.lead_generation_stock.region_name      IS 'Nom de la région (renvoyée par la source).';
COMMENT ON COLUMN public.lead_generation_stock.published_at     IS 'Date / heure de première publication chez la source.';

-- Index utiles pour le ciblage CEE (DPE faible, maisons individuelles, particuliers, fraîcheur).
CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_dpe_class
  ON public.lead_generation_stock (dpe_class)
  WHERE dpe_class IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_property_type
  ON public.lead_generation_stock (property_type)
  WHERE property_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_is_professional
  ON public.lead_generation_stock (is_professional);

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_published_at
  ON public.lead_generation_stock (published_at)
  WHERE published_at IS NOT NULL;
