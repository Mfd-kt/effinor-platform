-- Ajoute la valeur `landing_pac` à l'enum lead_source
-- Origine : simulateur de la landing pompe-a-chaleur.effinor.fr.
-- Distingue les leads landing PAC des leads site principal (source='website').

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'landing_pac';
