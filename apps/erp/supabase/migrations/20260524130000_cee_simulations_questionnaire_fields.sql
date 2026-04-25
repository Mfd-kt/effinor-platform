-- =============================================================================
-- cee_simulations — colonnes questionnaire détaillé (alignement prototype)
-- =============================================================================

ALTER TABLE public.cee_simulations
  ADD COLUMN IF NOT EXISTS profil text,
  ADD COLUMN IF NOT EXISTS type_logement text,
  ADD COLUMN IF NOT EXISTS periode_construction text,
  ADD COLUMN IF NOT EXISTS ite_iti_recente boolean,
  ADD COLUMN IF NOT EXISTS fenetres text,
  ADD COLUMN IF NOT EXISTS sous_sol boolean,
  ADD COLUMN IF NOT EXISTS btd_installe boolean,
  ADD COLUMN IF NOT EXISTS vmc_installee boolean,
  ADD COLUMN IF NOT EXISTS chauffage text,
  ADD COLUMN IF NOT EXISTS dpe text,
  ADD COLUMN IF NOT EXISTS travaux_cee_recus text,
  ADD COLUMN IF NOT EXISTS patrimoine_type text,
  ADD COLUMN IF NOT EXISTS nb_logements integer,
  ADD COLUMN IF NOT EXISTS surface_totale_m2 numeric,
  ADD COLUMN IF NOT EXISTS raison_sociale text,
  ADD COLUMN IF NOT EXISTS package_recommande text[];

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_profil_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_profil_check
  CHECK (profil IS NULL OR profil IN (
    'bailleur', 'sci', 'locataire', 'proprietaire_occupant'
  ));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_type_logement_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_type_logement_check
  CHECK (type_logement IS NULL OR type_logement IN ('maison', 'appartement'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_periode_construction_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_periode_construction_check
  CHECK (periode_construction IS NULL OR periode_construction IN ('avant_2000', 'apres_2000'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_chauffage_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_chauffage_check
  CHECK (chauffage IS NULL OR chauffage IN (
    'gaz', 'gaz_cond', 'fioul', 'elec', 'bois', 'granules', 'pac'
  ));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_fenetres_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_fenetres_check
  CHECK (fenetres IS NULL OR fenetres IN ('double_vitrage', 'simple_vitrage_bois'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_dpe_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_dpe_check
  CHECK (dpe IS NULL OR dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'inconnu'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_travaux_cee_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_travaux_cee_check
  CHECK (travaux_cee_recus IS NULL OR travaux_cee_recus IN ('oui', 'non', 'jsp'));

ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_patrimoine_type_check;
ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_patrimoine_type_check
  CHECK (patrimoine_type IS NULL OR patrimoine_type IN ('appartements', 'maisons', 'mixte'));

CREATE INDEX IF NOT EXISTS idx_cee_simulations_profil ON public.cee_simulations (profil);
CREATE INDEX IF NOT EXISTS idx_cee_simulations_chauffage ON public.cee_simulations (chauffage);
