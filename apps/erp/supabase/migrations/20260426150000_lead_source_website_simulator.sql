-- Ajoute la valeur `website_simulator` à l'enum lead_source
-- Origine : simulateur public effinor.fr/simulateur (API POST /api/simulator).
-- Distingue les leads « self-service site vitrine » des leads « simulator_cee »
-- (ceux créés par un agent dans l'ERP).

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'website_simulator';
