-- Famille produit « Pompe à chaleur » (fiches CEE PAC / simulateur `pac`).
--
-- Ne pas combiner avec un UPDATE utilisant `heat_pump` dans le même script :
-- PostgreSQL exige que la nouvelle valeur d’enum soit commitée avant usage (55P04).
-- Le backfill produit est dans la migration suivante.

ALTER TYPE public.product_family ADD VALUE IF NOT EXISTS 'heat_pump';
