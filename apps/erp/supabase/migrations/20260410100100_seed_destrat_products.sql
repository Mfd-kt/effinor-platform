-- =============================================================================
-- Seed: 3 destratification products + specs + key metrics
-- =============================================================================

-- ---------------------------------------------------------------------------
-- teddington_ds3
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  id, brand, reference, product_code, name, short_label, category,
  product_family, description,
  description_short, description_long,
  image_url, fallback_image_url,
  noise_db, airflow_m3h, max_throw, unit_power_w,
  is_active, sort_order, unit_label, default_price_ht,
  usage_contexts
) VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Teddington', 'ONSEN-DS3', 'teddington_ds3',
  'Teddington ONSEN DS3', 'ONSEN DS3', 'destratificateur',
  'destratification',
  'Modèle compact adapté aux bâtiments de hauteur intermédiaire nécessitant une remise en circulation efficace de l''air chaud accumulé en partie haute.',
  'Modèle compact adapté aux bâtiments de hauteur intermédiaire nécessitant une remise en circulation efficace de l''air chaud accumulé en partie haute.',
  'Le modèle Teddington ONSEN DS3 est retenu dans les configurations où le volume à traiter reste modéré à intermédiaire, avec un objectif d''homogénéisation thermique cohérente sans surdimensionnement inutile.',
  NULL, NULL,
  39.00, 2330.0000, 7.0000, 68.0000,
  true, 10, 'unité', 1250.00,
  '["simulator","study_pdf","quote","dimensioning"]'::jsonb
);

INSERT INTO public.product_specs (product_id, spec_key, spec_label, spec_value, spec_group, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'airflow',    'Débit d''air',          '2 330 m³/h', 'performance', 10),
  ('a0000000-0000-4000-8000-000000000001', 'throw',      'Portée verticale',      '7 m',        'performance', 20),
  ('a0000000-0000-4000-8000-000000000001', 'power',      'Consommation max',      '68 W',       'electrical',  30),
  ('a0000000-0000-4000-8000-000000000001', 'voltage',    'Alimentation',          '230 V',      'electrical',  40),
  ('a0000000-0000-4000-8000-000000000001', 'noise',      'Niveau sonore',         '39 dB(A)',   'comfort',     50),
  ('a0000000-0000-4000-8000-000000000001', 'ip_rating',  'Indice de protection',  'IP54',       'safety',      60);

INSERT INTO public.product_key_metrics (product_id, label, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Format compact',           10),
  ('a0000000-0000-4000-8000-000000000001', 'Bâtiments intermédiaires', 20),
  ('a0000000-0000-4000-8000-000000000001', 'Faible consommation',      30);

-- ---------------------------------------------------------------------------
-- teddington_ds7
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  id, brand, reference, product_code, name, short_label, category,
  product_family, description,
  description_short, description_long,
  image_url, fallback_image_url,
  noise_db, airflow_m3h, max_throw, unit_power_w,
  is_active, sort_order, unit_label, default_price_ht,
  usage_contexts
) VALUES (
  'a0000000-0000-4000-8000-000000000002',
  'Teddington', 'ONSEN-DS7', 'teddington_ds7',
  'Teddington ONSEN DS7', 'ONSEN DS7', 'destratificateur',
  'destratification',
  'Modèle haute capacité destiné aux bâtiments de grand volume, permettant une homogénéisation thermique cohérente dans les configurations industrielles et logistiques.',
  'Modèle haute capacité destiné aux bâtiments de grand volume, permettant une homogénéisation thermique cohérente dans les configurations industrielles et logistiques.',
  'Le modèle Teddington ONSEN DS7 convient aux sites présentant des volumes importants et des hauteurs significatives, avec un besoin de redistribution efficace des calories accumulées en partie haute.',
  NULL, NULL,
  45.00, 6500.0000, 10.0000, 120.0000,
  true, 20, 'unité', 1350.00,
  '["simulator","study_pdf","quote","dimensioning"]'::jsonb
);

INSERT INTO public.product_specs (product_id, spec_key, spec_label, spec_value, spec_group, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'airflow',    'Débit d''air',          '6 500 m³/h', 'performance', 10),
  ('a0000000-0000-4000-8000-000000000002', 'throw',      'Portée verticale',      '10 m',       'performance', 20),
  ('a0000000-0000-4000-8000-000000000002', 'power',      'Consommation max',      '120 W',      'electrical',  30),
  ('a0000000-0000-4000-8000-000000000002', 'voltage',    'Alimentation',          '230 V',      'electrical',  40),
  ('a0000000-0000-4000-8000-000000000002', 'noise',      'Niveau sonore',         '45 dB(A)',   'comfort',     50),
  ('a0000000-0000-4000-8000-000000000002', 'ip_rating',  'Indice de protection',  'IP54',       'safety',      60);

INSERT INTO public.product_key_metrics (product_id, label, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'Grand volume',      10),
  ('a0000000-0000-4000-8000-000000000002', 'Portée renforcée',  20),
  ('a0000000-0000-4000-8000-000000000002', 'Usage industriel',  30);

-- ---------------------------------------------------------------------------
-- generfeu
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  id, brand, reference, product_code, name, short_label, category,
  product_family, description,
  description_short, description_long,
  image_url, fallback_image_url,
  noise_db, airflow_m3h, max_throw, unit_power_w,
  is_active, sort_order, unit_label, default_price_ht,
  usage_contexts
) VALUES (
  'a0000000-0000-4000-8000-000000000003',
  'Generfeu', 'GENERFEU-HP', 'generfeu',
  'Generfeu Haute Performance', 'Generfeu HP', 'destratificateur',
  'destratification',
  'Modèle adapté aux grands volumes avec besoin de brassage élevé, retenu lorsque les contraintes de hauteur et de volume imposent un niveau de performance supérieur.',
  'Modèle adapté aux grands volumes avec besoin de brassage élevé, retenu lorsque les contraintes de hauteur et de volume imposent un niveau de performance supérieur.',
  'Le modèle Generfeu Haute Performance est destiné aux configurations les plus exigeantes, lorsque les hypothèses de volume traité, de hauteur utile et de brassage rendent nécessaire un niveau de performance renforcé.',
  NULL, NULL,
  48.00, 10000.0000, 12.0000, 150.0000,
  true, 30, 'unité', 2150.00,
  '["simulator","study_pdf","quote","dimensioning"]'::jsonb
);

INSERT INTO public.product_specs (product_id, spec_key, spec_label, spec_value, spec_group, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'airflow',    'Débit d''air',          '10 000 m³/h', 'performance', 10),
  ('a0000000-0000-4000-8000-000000000003', 'throw',      'Portée verticale',      '12 m',        'performance', 20),
  ('a0000000-0000-4000-8000-000000000003', 'power',      'Consommation max',      '150 W',       'electrical',  30),
  ('a0000000-0000-4000-8000-000000000003', 'voltage',    'Alimentation',          '230 V',       'electrical',  40),
  ('a0000000-0000-4000-8000-000000000003', 'noise',      'Niveau sonore',         '48 dB(A)',    'comfort',     50),
  ('a0000000-0000-4000-8000-000000000003', 'ip_rating',  'Indice de protection',  'IP55',        'safety',      60);

INSERT INTO public.product_key_metrics (product_id, label, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'Très grand volume', 10),
  ('a0000000-0000-4000-8000-000000000003', 'Hautes portées',    20),
  ('a0000000-0000-4000-8000-000000000003', 'Forte capacité',    30);
