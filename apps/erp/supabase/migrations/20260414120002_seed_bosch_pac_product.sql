-- Produit catalogue PAC (même clé que le catalogue TS `bosch_pac_air_eau`).
-- Le seul UPDATE précédent ne crée pas la ligne : sans INSERT, 0 ligne modifiée → invisible dans l’admin.

INSERT INTO public.products (
  id,
  brand,
  reference,
  product_code,
  name,
  short_label,
  category,
  product_family,
  description,
  description_short,
  description_long,
  image_url,
  fallback_image_url,
  noise_db,
  airflow_m3h,
  max_throw,
  unit_power_w,
  is_active,
  sort_order,
  unit_label,
  default_price_ht,
  usage_contexts
)
VALUES (
  'a0000000-0000-4000-8000-000000000004',
  'Bosch',
  'PAC-AIR-EAU-ETUDE',
  'bosch_pac_air_eau',
  'Pompe à chaleur air / eau Bosch (étude CEE)',
  'PAC Bosch air/eau',
  'pac',
  'heat_pump'::public.product_family,
  'Solution de remplacement ou d’optimisation par pompe à chaleur air / eau — rendement saisonnier élevé, compatible opérations CEE (référence commerciale indicative, modèle définitif après dimensionnement).',
  'Solution de remplacement ou d’optimisation par pompe à chaleur air / eau — rendement saisonnier élevé, compatible opérations CEE (référence commerciale indicative, modèle définitif après dimensionnement).',
  'Solution de remplacement ou d’optimisation par pompe à chaleur air / eau — rendement saisonnier élevé, compatible opérations CEE ; la référence commerciale est indicative, le modèle définitif est fixé après dimensionnement.',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  5,
  'unité',
  NULL,
  '["simulator","study_pdf","quote","dimensioning"]'::jsonb
)
ON CONFLICT (product_code) DO NOTHING;

-- Fiche technique (uniquement si la ligne vient d’être créée / pas encore de specs)
INSERT INTO public.product_specs (product_id, spec_key, spec_label, spec_value, spec_group, sort_order)
SELECT p.id, v.spec_key, v.spec_label, v.spec_value, v.spec_group, v.sort_order
FROM public.products p
CROSS JOIN (VALUES
  ('type',        'Type',        'Pompe à chaleur air / eau', 'performance', 10),
  ('brand',       'Marque',      'Bosch',                     'performance', 20),
  ('usage',       'Usage',       'Chauffage tertiaire / industriel léger', 'performance', 30),
  ('refrigerant', 'Fluide',      'R32 (indicatif — selon gamme retenue)', 'performance', 40),
  ('regulation',  'Régulation',  'Sonde extérieure / courbe d’eau (principe)', 'performance', 50),
  ('warranty',    'Garantie',    'Selon conditions fabricant / poseur', 'performance', 60)
) AS v(spec_key, spec_label, spec_value, spec_group, sort_order)
WHERE p.product_code = 'bosch_pac_air_eau'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_specs ps WHERE ps.product_id = p.id AND ps.spec_key = v.spec_key
  );

INSERT INTO public.product_key_metrics (product_id, label, sort_order)
SELECT p.id, v.label, v.sort_order
FROM public.products p
CROSS JOIN (VALUES
  ('Potentiel indicatif (simulation)', 10),
  ('Éligibilité sous réserve dossier', 20),
  ('Chiffrage à confirmer', 30)
) AS v(label, sort_order)
WHERE p.product_code = 'bosch_pac_air_eau'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_key_metrics m WHERE m.product_id = p.id AND m.label = v.label
  );
