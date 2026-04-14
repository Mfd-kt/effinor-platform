-- ============================================
-- Migration: Exemple de liaison d'accessoires
-- Date: 2025-12-04
-- Description:
--   Exemples concrets pour lier des accessoires aux produits.
--   ⚠️ ADAPTE les slugs selon tes produits réels !
-- ============================================

-- ============================================
-- MÉTHODE 1 : Lier par slug (si tu connais les slugs exacts)
-- ============================================

-- Exemple 1 : Lier "Kit de suspension" à tous les Highbay LED
-- Remplace 'highbay-led-xxx' par les vrais slugs de tes Highbay
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
SELECT 
  p.id AS product_id,
  a.id AS accessory_id,
  0 AS priorite
FROM public.products p
CROSS JOIN public.products a
WHERE 
  -- Produit principal : Highbay LED (adapte selon tes slugs)
  (p.slug LIKE '%highbay%' OR p.slug LIKE '%high-bay%' OR p.categorie = 'luminaires_industriels')
  AND p.actif = true
  -- Accessoire : Kit de suspension
  AND a.slug = 'acc-kit-suspension-highbay'
  AND a.actif = true
  -- Évite les doublons
  AND NOT EXISTS (
    SELECT 1 FROM public.product_accessories pa
    WHERE pa.product_id = p.id AND pa.accessory_id = a.id
  )
LIMIT 10;  -- Limite pour éviter trop de liens

-- Exemple 2 : Lier "Capteur de présence" à tous les Highbay
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
SELECT 
  p.id AS product_id,
  a.id AS accessory_id,
  1 AS priorite
FROM public.products p
CROSS JOIN public.products a
WHERE 
  (p.slug LIKE '%highbay%' OR p.slug LIKE '%high-bay%' OR p.categorie = 'luminaires_industriels')
  AND p.actif = true
  AND a.slug = 'acc-capteur-presence-plafond-hf'
  AND a.actif = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_accessories pa
    WHERE pa.product_id = p.id AND pa.accessory_id = a.id
  )
LIMIT 10;

-- Exemple 3 : Lier "Support orientable" à tous les projecteurs LED
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
SELECT 
  p.id AS product_id,
  a.id AS accessory_id,
  0 AS priorite
FROM public.products p
CROSS JOIN public.products a
WHERE 
  (p.slug LIKE '%projecteur%' OR p.slug LIKE '%floodlight%' OR p.categorie = 'eclairage_exterieur')
  AND p.actif = true
  AND a.slug = 'acc-support-orientable-projecteur'
  AND a.actif = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_accessories pa
    WHERE pa.product_id = p.id AND pa.accessory_id = a.id
  )
LIMIT 10;

-- ============================================
-- MÉTHODE 2 : Lier par catégorie (plus automatique)
-- ============================================

-- Lier tous les accessoires "accessoires" aux produits "luminaires_industriels"
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
SELECT 
  p.id AS product_id,
  a.id AS accessory_id,
  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY a.ordre) - 1 AS priorite
FROM public.products p
CROSS JOIN public.products a
WHERE 
  p.categorie = 'luminaires_industriels'
  AND p.actif = true
  AND a.categorie = 'accessoires'
  AND a.actif = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_accessories pa
    WHERE pa.product_id = p.id AND pa.accessory_id = a.id
  );

-- Lier les accessoires "accessoires_borne_recharge" aux bornes de recharge
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
SELECT 
  p.id AS product_id,
  a.id AS accessory_id,
  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY a.ordre) - 1 AS priorite
FROM public.products p
CROSS JOIN public.products a
WHERE 
  (p.categorie LIKE '%borne%' OR p.slug LIKE '%borne%' OR p.nom LIKE '%borne%')
  AND p.actif = true
  AND a.categorie = 'accessoires_borne_recharge'
  AND a.actif = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_accessories pa
    WHERE pa.product_id = p.id AND pa.accessory_id = a.id
  );

-- ============================================
-- MÉTHODE 3 : Lier manuellement un produit spécifique
-- ============================================

-- Exemple : Lier "Câble Type 2 - 5m" à "Borne de recharge pour maison"
-- Remplace les slugs par les vrais slugs de tes produits
/*
INSERT INTO public.product_accessories (product_id, accessory_id, priorite)
VALUES
(
  (SELECT id FROM public.products WHERE slug = 'borne-recharge-maison' LIMIT 1),
  (SELECT id FROM public.products WHERE slug = 'acc-cable-type2-5m' LIMIT 1),
  0
),
(
  (SELECT id FROM public.products WHERE slug = 'borne-recharge-maison' LIMIT 1),
  (SELECT id FROM public.products WHERE slug = 'acc-support-mural-cable' LIMIT 1),
  1
),
(
  (SELECT id FROM public.products WHERE slug = 'borne-recharge-maison' LIMIT 1),
  (SELECT id FROM public.products WHERE slug = 'acc-kit-trappe-cache-cablage' LIMIT 1),
  2
)
ON CONFLICT (product_id, accessory_id) DO NOTHING;
*/

-- ============================================
-- VÉRIFICATION : Voir les liens créés
-- ============================================

-- Pour voir tous les liens créés :
/*
SELECT 
  p.nom AS produit_principal,
  a.nom AS accessoire,
  pa.priorite
FROM public.product_accessories pa
JOIN public.products p ON pa.product_id = p.id
JOIN public.products a ON pa.accessory_id = a.id
ORDER BY p.nom, pa.priorite;
*/

-- ============================================
-- NETTOYAGE : Supprimer tous les liens (si besoin)
-- ============================================

-- ⚠️ ATTENTION : Ceci supprime TOUS les liens !
-- Décommente seulement si tu veux tout recommencer
/*
DELETE FROM public.product_accessories;
*/














