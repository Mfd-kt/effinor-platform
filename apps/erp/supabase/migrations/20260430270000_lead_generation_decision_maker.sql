-- Décideur B2B (extraction publique, sans invention) — noms / rôles issus du web uniquement.

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS decision_maker_name text,
  ADD COLUMN IF NOT EXISTS decision_maker_role text,
  ADD COLUMN IF NOT EXISTS decision_maker_source text,
  ADD COLUMN IF NOT EXISTS decision_maker_confidence text;

COMMENT ON COLUMN public.lead_generation_stock.decision_maker_name IS
  'Nom complet du décideur si extrait de sources publiques (site, recherche) — jamais inventé.';
COMMENT ON COLUMN public.lead_generation_stock.decision_maker_role IS
  'Intitulé de fonction ou rôle tel qu’extrait (directeur, gérant, technique, etc.).';
COMMENT ON COLUMN public.lead_generation_stock.decision_maker_source IS
  'Origine principale de l’extraction : website | google | linkedin.';
COMMENT ON COLUMN public.lead_generation_stock.decision_maker_confidence IS
  'Niveau de confiance : high (LinkedIn), medium (site), low (recherche web).';

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_decision_maker_source_check;
ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_decision_maker_source_check CHECK (
    decision_maker_source IS NULL
    OR decision_maker_source IN ('website', 'google', 'linkedin')
  );

ALTER TABLE public.lead_generation_stock DROP CONSTRAINT IF EXISTS lead_generation_stock_decision_maker_confidence_check;
ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_decision_maker_confidence_check CHECK (
    decision_maker_confidence IS NULL
    OR decision_maker_confidence IN ('low', 'medium', 'high')
  );
