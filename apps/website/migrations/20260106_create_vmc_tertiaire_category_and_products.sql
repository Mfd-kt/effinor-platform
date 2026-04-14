-- ============================================
-- Migration: Créer catégorie "VMC Tertiaire" et ajouter les produits VMC Axelair
-- Date: 2026-01-06
-- Description: Ajoute la catégorie VMC Tertiaire (grande catégorie: Ventilation) et tous les produits associés
-- ============================================

-- 1. Créer la catégorie "VMC Tertiaire"
INSERT INTO public.categories (
  nom,
  slug,
  description,
  description_longue,
  ordre,
  actif,
  mega_categorie,
  images,
  created_at
) VALUES (
  'VMC Tertiaire',
  'vmc-tertiaire',
  'Caissons d''extraction VMC pour applications tertiaires. Solutions haute performance pour ventilation mécanique contrôlée dans bureaux, commerces et établissements.',
  'Les caissons d''extraction VMC Axelair sont conçus pour la ventilation mécanique contrôlée dans les applications tertiaires. Disponibles en différentes configurations (compact, isolé, avec filtre G4) et diamètres (125mm à 315mm), ils offrent une solution complète pour la qualité de l''air intérieur.

**Pourquoi choisir nos Caissons VMC Tertiaire ?**

✅ **Performance optimale** : Moteurs EC haute performance pour une consommation énergétique réduite jusqu''à 60% par rapport aux moteurs classiques.

✅ **Confort acoustique** : Modèles isolés en laine de verre pour un fonctionnement silencieux, adaptés aux environnements tertiaires.

✅ **Filtration efficace** : Options avec filtre G4 pour une qualité d''air optimale dans les espaces sensibles.

✅ **Installation simplifiée** : Design compact et modulaire facilitant l''installation et la maintenance.

✅ **Gamme complète** : Diamètres de 125mm à 315mm pour s''adapter à tous les besoins de débit.

✅ **Éligible CEE** : Certains modèles sont éligibles aux Certificats d''Économies d''Énergie (CEE).

Ideal pour : Bureaux, commerces, établissements scolaires, hôtels, restaurants, établissements de santé, espaces tertiaires nécessitant une ventilation contrôlée.',
  10,
  true,
  'ventilation',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  mega_categorie = EXCLUDED.mega_categorie,
  images = EXCLUDED.images;

-- 2. Récupérer l'ID de la catégorie créée
DO $$
DECLARE
  vmc_categorie_id UUID;
BEGIN
  SELECT id INTO vmc_categorie_id 
  FROM public.categories 
  WHERE slug = 'vmc-tertiaire';

  -- 3. Insérer tous les produits VMC Axelair
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
  -- Minimax Compact Ø 125mm
  (
    'Caisson d''extraction VMC compact Ø 125 mm Minimax CM125 - AXELAIR',
    'caisson-extraction-vmc-compact-125mm-minimax-cm125-axelair',
    'Caisson d''extraction VMC compact Ø 125 mm Minimax CM125. Solution économique pour ventilation tertiaire. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CM125',
    302.25,
    false,
    true,
    true,
    1,
    NOW()
  ),
  -- Minimax Isolé Ø 125mm
  (
    'Caisson d''extraction VMC isolé laine de verre Ø 125 mm Minimax CMISO125 - AXELAIR',
    'caisson-extraction-vmc-isole-125mm-minimax-cmiso125-axelair',
    'Caisson d''extraction VMC isolé en laine de verre Ø 125 mm Minimax CMISO125. Fonctionnement silencieux pour environnements tertiaires. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISO125',
    302.25,
    false,
    true,
    true,
    2,
    NOW()
  ),
  -- Minimax Isolé avec filtre G4 Ø 125mm
  (
    'Caisson d''extraction VMC isolé laine de verre avec filtre G4 Ø 125 mm Minimax CMISOG4125 - AXELAIR',
    'caisson-extraction-vmc-isole-filtre-g4-125mm-minimax-cmisog4125-axelair',
    'Caisson d''extraction VMC isolé avec filtre G4 Ø 125 mm Minimax CMISOG4125. Filtration optimale pour qualité d''air. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISOG4125',
    302.25,
    false,
    true,
    true,
    3,
    NOW()
  ),
  -- Minimax Compact Ø 160mm
  (
    'Caisson d''extraction VMC compact Ø 160 mm Minimax CM160 - AXELAIR',
    'caisson-extraction-vmc-compact-160mm-minimax-cm160-axelair',
    'Caisson d''extraction VMC compact Ø 160 mm Minimax CM160. Débit moyen pour espaces tertiaires. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CM160',
    302.25,
    false,
    true,
    true,
    4,
    NOW()
  ),
  -- Minimax Isolé Ø 160mm
  (
    'Caisson d''extraction VMC isolé laine de verre Ø 160 mm Minimax CMISO160 - AXELAIR',
    'caisson-extraction-vmc-isole-160mm-minimax-cmiso160-axelair',
    'Caisson d''extraction VMC isolé en laine de verre Ø 160 mm Minimax CMISO160. Isolation acoustique renforcée. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISO160',
    302.25,
    false,
    true,
    true,
    5,
    NOW()
  ),
  -- Minimax Isolé avec filtre G4 Ø 160mm
  (
    'Caisson d''extraction VMC isolé laine de verre avec filtre G4 Ø 160 mm Minimax CMISOG4160 - AXELAIR',
    'caisson-extraction-vmc-isole-filtre-g4-160mm-minimax-cmisog4160-axelair',
    'Caisson d''extraction VMC isolé avec filtre G4 Ø 160 mm Minimax CMISOG4160. Filtration G4 et isolation acoustique. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISOG4160',
    302.25,
    false,
    true,
    true,
    6,
    NOW()
  ),
  -- Minimax Haut débit Ø 200mm
  (
    'Caisson d''extraction VMC haut débit Ø 200 mm Minimax CM200 - AXELAIR',
    'caisson-extraction-vmc-haut-debit-200mm-minimax-cm200-axelair',
    'Caisson d''extraction VMC haut débit Ø 200 mm Minimax CM200. Débit élevé pour grands volumes tertiaires. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CM200',
    302.25,
    false,
    true,
    true,
    7,
    NOW()
  ),
  -- Minimax Isolé Ø 200mm
  (
    'Caisson d''extraction VMC isolé laine de verre Ø 200 mm Minimax CMISO200 - AXELAIR',
    'caisson-extraction-vmc-isole-200mm-minimax-cmiso200-axelair',
    'Caisson d''extraction VMC isolé en laine de verre Ø 200 mm Minimax CMISO200. Isolation pour fonctionnement silencieux. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISO200',
    302.25,
    false,
    true,
    true,
    8,
    NOW()
  ),
  -- Minimax Isolé avec filtre G4 Ø 200mm
  (
    'Caisson d''extraction VMC isolé laine de verre avec filtre G4 Ø 200 mm Minimax CMISOG4200 - AXELAIR',
    'caisson-extraction-vmc-isole-filtre-g4-200mm-minimax-cmisog4200-axelair',
    'Caisson d''extraction VMC isolé avec filtre G4 Ø 200 mm Minimax CMISOG4200. Filtration G4 et isolation pour environnements sensibles. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISOG4200',
    551.85,
    false,
    true,
    true,
    9,
    NOW()
  ),
  -- Minimax Haut débit Ø 250mm
  (
    'Caisson d''extraction VMC haut débit Ø 250 mm Minimax CM250 - AXELAIR',
    'caisson-extraction-vmc-haut-debit-250mm-minimax-cm250-axelair',
    'Caisson d''extraction VMC haut débit Ø 250 mm Minimax CM250. Débit très élevé pour grands espaces tertiaires. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CM250',
    551.85,
    false,
    true,
    true,
    10,
    NOW()
  ),
  -- Minimax Isolé Ø 250mm
  (
    'Caisson d''extraction VMC isolé laine de verre Ø 250 mm Minimax CMISO250 - AXELAIR',
    'caisson-extraction-vmc-isole-250mm-minimax-cmiso250-axelair',
    'Caisson d''extraction VMC isolé en laine de verre Ø 250 mm Minimax CMISO250. Isolation et débit élevé. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISO250',
    551.85,
    false,
    true,
    true,
    11,
    NOW()
  ),
  -- Minimax Isolé avec filtre G4 Ø 250mm
  (
    'Caisson d''extraction VMC isolé laine de verre avec filtre G4 Ø 250 mm Minimax CMISOG4250 - AXELAIR',
    'caisson-extraction-vmc-isole-filtre-g4-250mm-minimax-cmisog4250-axelair',
    'Caisson d''extraction VMC isolé avec filtre G4 Ø 250 mm Minimax CMISOG4250. Filtration G4 et isolation pour grands volumes. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMISOG4250',
    551.85,
    false,
    true,
    true,
    12,
    NOW()
  ),
  -- Minimax Très haut débit Ø 315mm
  (
    'Caisson d''extraction VMC très haut débit Ø 315 mm Minimax CM315 - AXELAIR',
    'caisson-extraction-vmc-tres-haut-debit-315mm-minimax-cm315-axelair',
    'Caisson d''extraction VMC très haut débit Ø 315 mm Minimax CM315. Débit maximum pour très grands volumes tertiaires. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CM315',
    685.10,
    false,
    true,
    true,
    13,
    NOW()
  ),
  -- Miniblue Basse consommation Ø 125mm LOBBY
  (
    'Caisson d''extraction VMC basse consommation moteur EC Ø 125 mm LOBBY® Miniblue CMSL125 - AXELAIR',
    'caisson-extraction-vmc-basse-consommation-125mm-lobby-miniblue-cmsl125-axelair',
    'Caisson d''extraction VMC basse consommation moteur EC Ø 125 mm LOBBY® Miniblue CMSL125. Moteur EC haute performance pour économies d''énergie jusqu''à 60%. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMSL125',
    1152.45,
    false,
    true,
    true,
    14,
    NOW()
  ),
  -- Miniblue Basse consommation Ø 160mm
  (
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm Miniblue CMS160 - AXELAIR',
    'caisson-extraction-vmc-basse-consommation-160mm-miniblue-cms160-axelair',
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm Miniblue CMS160. Moteur EC pour performance énergétique optimale. Délai: 1 à 2 jours ouvrés.',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMS160',
    702.00,
    false,
    true,
    true,
    15,
    NOW()
  ),
  -- Miniblue Basse consommation avec filtre G4 Ø 160mm
  (
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm avec filtre G4 Miniblue CMSG4160 - AXELAIR',
    'caisson-extraction-vmc-basse-consommation-filtre-g4-160mm-miniblue-cmsg4160-axelair',
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm avec filtre G4 Miniblue CMSG4160. Moteur EC et filtration G4 pour qualité d''air optimale. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMSG4160',
    728.00,
    false,
    true,
    true,
    16,
    NOW()
  ),
  -- Miniblue Basse consommation Ø 160mm LOBBY
  (
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm LOBBY® Miniblue CMSL160 - AXELAIR',
    'caisson-extraction-vmc-basse-consommation-160mm-lobby-miniblue-cmsl160-axelair',
    'Caisson d''extraction VMC basse consommation moteur EC Ø 160 mm LOBBY® Miniblue CMSL160. Moteur EC haute performance pour applications tertiaires exigeantes. Délai: Livrable semaine 6 (semaine du 02/02/2026).',
    'vmc-tertiaire',
    vmc_categorie_id,
    'Axelair',
    'AX CMSL160',
    1209.00,
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
    prix = EXCLUDED.prix;

  RAISE NOTICE '✅ Catégorie VMC Tertiaire et produits créés avec succès !';
END $$;

-- ============================================
-- Vérification
-- ============================================
SELECT 
  c.nom as categorie,
  c.mega_categorie,
  COUNT(p.id) as nombre_produits
FROM public.categories c
LEFT JOIN public.products p ON p.categorie_id = c.id
WHERE c.slug = 'vmc-tertiaire'
GROUP BY c.nom, c.mega_categorie;

SELECT 
  nom,
  reference,
  prix,
  actif
FROM public.products
WHERE categorie_id = (SELECT id FROM public.categories WHERE slug = 'vmc-tertiaire')
ORDER BY ordre;

