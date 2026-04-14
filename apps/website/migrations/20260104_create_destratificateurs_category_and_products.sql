-- ============================================
-- Migration: Créer catégorie "Déstratificateur industriel" et ajouter les produits
-- Date: 2025-01-04
-- Description: Ajoute la catégorie déstratificateurs et tous les produits associés
-- ============================================

-- 1. Créer la catégorie "Déstratificateur industriel"
INSERT INTO public.categories (
  nom,
  slug,
  description,
  description_longue,
  ordre,
  actif,
  images,
  created_at
) VALUES (
  'Déstratificateur industriel',
  'destratificateur-industriel',
  'Déstratificateurs d''air industriels pour optimiser la température et réduire les coûts énergétiques dans les entrepôts, halls industriels et grands volumes.',
  'Les déstratificateurs industriels Effinor permettent de répartir uniformément la chaleur dans les grands volumes, réduisant les écarts de température entre le sol et le plafond. Cette solution optimise le confort thermique et permet des économies d''énergie significatives.

**Pourquoi choisir nos Déstratificateurs industriels ?**

✅ **Économies d''énergie** : Réduction jusqu''à 30% de la consommation de chauffage en répartissant uniformément la chaleur.

✅ **Confort thermique optimal** : Élimination des zones froides au sol et des surchauffes en hauteur.

✅ **Installation simple** : Montage au plafond, fonctionnement silencieux et autonome.

✅ **Robustesse industrielle** : Conçus pour les environnements industriels exigeants avec résistance aux poussières et températures élevées.

✅ **Éligible CEE** : Certains modèles sont éligibles aux Certificats d''Économies d''Énergie (CEE).

✅ **Maintenance réduite** : Moteurs EC haute performance avec durée de vie prolongée.

Ideal pour : Entrepôts, halls industriels, ateliers de grande hauteur, hangars logistiques, centres de distribution.',
  9,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 2. Récupérer l'ID de la catégorie créée
DO $$
DECLARE
  destrat_categorie_id UUID;
BEGIN
  SELECT id INTO destrat_categorie_id 
  FROM public.categories 
  WHERE slug = 'destratificateur-industriel';

  -- 3. Insérer tous les produits de déstratificateurs
  INSERT INTO public.products (
    nom,
    slug,
    description,
    categorie,
    categorie_id,
    marque,
    reference,
    prix,
    sur_devis,
    actif,
    prime_cee,
    ordre,
    created_at
  ) VALUES
  -- VTS (VOLCANO)
  (
    'Déstratificateur industriel caréné moteur EC VR-D MINI - VOLCANO',
    'destratificateur-vr-d-mini-volcano',
    'Déstratificateur industriel compact VR-D MINI avec moteur EC haute performance. Idéal pour les espaces de moyenne hauteur. Réduction des coûts de chauffage jusqu''à 30%. Livrable sous 1 à 2 semaines.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'VTS',
    'VT 0498',
    477.75,
    false,
    true,
    true,
    1,
    NOW()
  ),
  (
    'Déstratificateur industriel caréné moteur EC VR-D - VOLCANO',
    'destratificateur-vr-d-volcano',
    'Déstratificateur industriel VR-D avec moteur EC pour grands volumes. Performance optimale pour entrepôts et halls industriels. Réduction significative des coûts énergétiques. Livraison rapide 1 à 2 jours.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'VTS',
    'VT 0450',
    632.25,
    false,
    true,
    true,
    2,
    NOW()
  ),

  -- SOVELOR-DANTHERM
  (
    'Déstratificateur à commande automatique SDS4 - SOVELOR-DANTHERM',
    'destratificateur-sds4-sovelor-dantherm',
    'Déstratificateur automatique SDS4 pour volumes moyens. Commande automatique intégrée, installation simple au plafond. Optimisation énergétique garantie.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'SOVELOR',
    'SO SDS4',
    509.96,
    false,
    true,
    true,
    3,
    NOW()
  ),
  (
    'Déstratificateur à commande automatique SDS10 - SOVELOR-DANTHERM',
    'destratificateur-sds10-sovelor-dantherm',
    'Déstratificateur automatique SDS10 haute performance pour grands volumes. Commande automatique, répartition optimale de la chaleur. Idéal pour entrepôts et halls industriels.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'SOVELOR',
    'SO SDS10',
    874.00,
    false,
    true,
    true,
    4,
    NOW()
  ),

  -- SEET
  (
    'Déstratificateur d''air SDS 6 + Thermostat de déstratification - SEET',
    'destratificateur-sds6-thermostat-seet',
    'Déstratificateur d''air SDS 6 avec thermostat de déstratification intégré. Solution complète pour volumes moyens. Contrôle automatique de la température optimale.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'SEET',
    'SE SDS6',
    709.80,
    false,
    true,
    true,
    5,
    NOW()
  ),
  (
    'Déstratificateur d''air SDS 10 + Thermostat de déstratification - SEET',
    'destratificateur-sds10-thermostat-seet',
    'Déstratificateur d''air SDS 10 avec thermostat de déstratification intégré. Haute performance pour grands volumes. Solution complète avec contrôle automatique.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'SEET',
    'SE SDS10',
    968.80,
    false,
    true,
    true,
    6,
    NOW()
  ),

  -- AXELAIR
  (
    'Déstratificateur monophasé caréné avec thermostat DS 4000 - AXELAIR',
    'destratificateur-ds4000-axelair',
    'Déstratificateur monophasé DS 4000 avec thermostat intégré. Design caréné robuste, installation simple. Optimisation énergétique pour volumes moyens.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'AXELAIR',
    'AX DS4000',
    553.80,
    false,
    true,
    true,
    7,
    NOW()
  ),
  (
    'Déstratificateur monophasé caréné avec thermostat DS 6000 - AXELAIR',
    'destratificateur-ds6000-axelair',
    'Déstratificateur monophasé DS 6000 avec thermostat intégré. Performance accrue pour volumes importants. Design caréné professionnel.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'AXELAIR',
    'AX DS6000',
    687.70,
    false,
    true,
    true,
    8,
    NOW()
  ),
  (
    'Déstratificateur monophasé caréné avec thermostat DS 8000 - AXELAIR',
    'destratificateur-ds8000-axelair',
    'Déstratificateur monophasé DS 8000 avec thermostat intégré. Haute performance pour très grands volumes. Solution professionnelle optimale.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'AXELAIR',
    'AX DS8000',
    790.40,
    false,
    true,
    true,
    9,
    NOW()
  ),

  -- S.PLUS
  (
    'Déstratificateur CEE industriel ELITURBO 75 - SPLUS',
    'destratificateur-eliturb-75-splus',
    'Déstratificateur CEE industriel ELITURBO 75. Éligible aux Certificats d''Économies d''Énergie. Performance optimale pour volumes moyens. Moteur EC haute efficacité.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151165',
    1061.28,
    false,
    true,
    true,
    10,
    NOW()
  ),
  (
    'Déstratificateur CEE industriel ELITURBO 100 - SPLUS',
    'destratificateur-eliturb-100-splus',
    'Déstratificateur CEE industriel ELITURBO 100. Éligible aux Certificats d''Économies d''Énergie. Haute performance pour grands volumes. Moteur EC optimisé.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151166',
    1073.52,
    false,
    true,
    true,
    11,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 400 - SPLUS',
    'destratificateur-ves-400-splus',
    'Déstratificateur d''air carrossé VES 400. Design compact et robuste. Installation simple au plafond. Optimisation énergétique pour volumes moyens.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151130',
    814.32,
    false,
    true,
    true,
    12,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 800 - SPLUS',
    'destratificateur-ves-800-splus',
    'Déstratificateur d''air carrossé VES 800. Performance accrue pour volumes importants. Design carrossé professionnel. Installation et maintenance simplifiées.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151140',
    959.04,
    false,
    true,
    true,
    13,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 1400 - SPLUS',
    'destratificateur-ves-1400-splus',
    'Déstratificateur d''air carrossé VES 1400. Haute performance pour très grands volumes. Design robuste et professionnel. Optimisation énergétique maximale.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151150',
    1191.60,
    false,
    true,
    true,
    14,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 400 avec moteur EC - SPLUS',
    'destratificateur-ves-400-ec-splus',
    'Déstratificateur d''air carrossé VES 400 avec moteur EC haute performance. Efficacité énergétique optimale. Design compact et robuste.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151146',
    1038.96,
    false,
    true,
    true,
    15,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 800 avec moteur EC - SPLUS',
    'destratificateur-ves-800-ec-splus',
    'Déstratificateur d''air carrossé VES 800 avec moteur EC haute performance. Performance accrue et économies d''énergie maximales. Idéal pour volumes importants.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151145',
    1361.52,
    false,
    true,
    true,
    16,
    NOW()
  ),
  (
    'Déstratificateur d''air carrossé VES 1400 avec moteur EC - SPLUS',
    'destratificateur-ves-1400-ec-splus',
    'Déstratificateur d''air carrossé VES 1400 avec moteur EC haute performance. Solution professionnelle pour très grands volumes. Optimisation énergétique exceptionnelle.',
    'destratificateur-industriel',
    destrat_categorie_id,
    'S.PLUS',
    'SP 1151144',
    1964.16,
    false,
    true,
    true,
    17,
    NOW()
  )

  ON CONFLICT (slug) DO UPDATE SET
    nom = EXCLUDED.nom,
    description = EXCLUDED.description,
    categorie = EXCLUDED.categorie,
    categorie_id = EXCLUDED.categorie_id,
    marque = EXCLUDED.marque,
    reference = EXCLUDED.reference,
    prix = EXCLUDED.prix,
    ordre = EXCLUDED.ordre;

END $$;

-- Vérification
SELECT 
  COUNT(*) as total_destratificateurs,
  COUNT(CASE WHEN actif = true THEN 1 END) as actifs,
  COUNT(CASE WHEN prime_cee = true THEN 1 END) as eligibles_cee
FROM public.products 
WHERE categorie = 'destratificateur-industriel' 
   OR categorie_id IN (SELECT id FROM public.categories WHERE slug = 'destratificateur-industriel');

-- Afficher les produits créés
SELECT 
  ordre,
  nom,
  marque,
  reference,
  prix,
  CASE WHEN prime_cee = true THEN '✅' ELSE '❌' END as cee,
  actif
FROM public.products 
WHERE categorie = 'destratificateur-industriel' 
   OR categorie_id IN (SELECT id FROM public.categories WHERE slug = 'destratificateur-industriel')
ORDER BY ordre;

