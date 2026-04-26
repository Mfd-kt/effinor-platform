-- Ajoute la valeur `landing_reno_global` à l'enum lead_source
-- Origine : simulateur de la landing renovation.effinor.fr (BAR-TH-174).
-- Distingue les leads landing Rénovation globale des autres sources
-- (website, landing_pac, simulator_cee).

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'landing_reno_global';
