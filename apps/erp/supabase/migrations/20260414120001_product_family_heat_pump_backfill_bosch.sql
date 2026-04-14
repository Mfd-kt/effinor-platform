-- Après commit de `heat_pump` sur l’enum (migration précédente).

UPDATE public.products
SET product_family = 'heat_pump'::public.product_family,
    category = 'pac',
    updated_at = now()
WHERE product_code = 'bosch_pac_air_eau'
  AND deleted_at IS NULL;
