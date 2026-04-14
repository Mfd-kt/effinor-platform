-- ============================================
-- Migration: Créer catégorie Lampes industrielles et produits
-- Date: 2026-01-07
-- Description: Ajoute la catégorie Lampes industrielles (grande catégorie: luminaire)
--              et tous les produits de lampes industrielles LED
-- ============================================

-- Créer la catégorie Lampes industrielles
INSERT INTO public.categories (
  nom,
  slug,
  description,
  description_longue,
  ordre,
  actif,
  images,
  mega_categorie,
  created_at
) VALUES (
  'Lampes industrielles',
  'lampes-industrielles',
  'Gamme complète de lampes industrielles LED pour l''éclairage des ateliers, entrepôts et locaux techniques. Lampes cloche, rack et faible éblouissement.',
  'Nos lampes industrielles LED offrent un éclairage performant et économique pour tous vos locaux industriels. Disponibles en plusieurs formats : lampes cloche suspendues, lampes rack linéaires et lampes à faible éblouissement pour un confort visuel optimal.

**Pourquoi choisir nos lampes industrielles LED ?**

✅ **Haute performance** : Efficacité lumineuse jusqu''à 185 lm/W
✅ **Robustesse** : Protection IP65 pour environnements exigeants
✅ **Longue durée de vie** : Jusqu''à 7 ans de garantie
✅ **Installation simple** : Suspension, fixation murale ou plafond
✅ **Économies d''énergie** : Jusqu''à 80% d''économies par rapport aux solutions traditionnelles
✅ **Confort visuel** : Modèles à faible éblouissement disponibles
✅ **Pilotage DALI** : Certains modèles compatibles avec systèmes de gestion

**Types de lampes disponibles :**
- **Lampes cloche** : Éclairage directionnel suspendu, idéal pour hautes hauteurs
- **Lampes rack** : Éclairage linéaire suspendu, uniforme et performant
- **Lampes faible éblouissement** : Confort visuel optimal pour zones de travail

Idéal pour : Ateliers, entrepôts, zones de production, locaux techniques, parkings couverts, halls industriels.',
  12,
  true,
  '[]'::jsonb,
  'luminaire',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images,
  mega_categorie = EXCLUDED.mega_categorie;

-- Insérer tous les produits de lampes industrielles
INSERT INTO public.products (
  nom,
  slug,
  categorie,
  categorie_id,
  description,
  marque,
  reference,
  prix,
  sur_devis,
  prime_cee,
  actif,
  ordre,
  puissance
) VALUES
-- V-TAC - Lampes cloche
('LAMPE INDUSTRIELLE LED CLOCHE 100W CCT IP65',
 'lampe-industrielle-led-cloche-100w-vtac',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 100W avec température de couleur réglable (CCT). Protection IP65, flux lumineux 8300 lm.',
 'V-TAC',
 'VT CLOCHE 100W',
 29.68,
 FALSE,
 FALSE,
 TRUE,
 1,
 '100W'),

('LAMPE INDUSTRIELLE LED CLOCHE 150W CCT IP65',
 'lampe-industrielle-led-cloche-150w-vtac',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 150W avec température de couleur réglable (CCT). Protection IP65, flux lumineux 12300 lm.',
 'V-TAC',
 'VT CLOCHE 150W',
 37.08,
 FALSE,
 FALSE,
 TRUE,
 2,
 '150W'),

('LAMPE INDUSTRIELLE LED CLOCHE 150W 135LM/W IP65',
 'lampe-industrielle-led-cloche-150w-135lmw',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 150W haute efficacité 135 lm/W. Protection IP65, flux lumineux 20250 lm. Garantie 5 ans.',
 'V-TAC',
 'VT CLOCHE 150W 135',
 37.59,
 FALSE,
 FALSE,
 TRUE,
 3,
 '150W'),

('LAMPE INDUSTRIELLE LED CLOCHE 200W 135LM/W IP65',
 'lampe-industrielle-led-cloche-200w-135lmw',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 200W haute efficacité 135 lm/W. Protection IP65, flux lumineux 27000 lm. Garantie 5 ans.',
 'V-TAC',
 'VT CLOCHE 200W 135',
 52.99,
 FALSE,
 FALSE,
 TRUE,
 4,
 '200W'),

-- CLAREO LIGHTING - Lampes cloche
('LAMPE INDUSTRIELLE LED CLOCHE 70W 160LM/W IP65',
 'lampe-industrielle-led-cloche-70w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 70W très haute efficacité 160 lm/W. Protection IP65, flux lumineux 10800-11200 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 70W',
 73.10,
 FALSE,
 FALSE,
 TRUE,
 5,
 '70W'),

('LAMPE INDUSTRIELLE LED CLOCHE 100W 160LM/W IP65',
 'lampe-industrielle-led-cloche-100w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 100W très haute efficacité 160 lm/W. Protection IP65, flux lumineux 15200-16000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 100W',
 84.53,
 FALSE,
 FALSE,
 TRUE,
 6,
 '100W'),

('LAMPE INDUSTRIELLE LED CLOCHE 150W 160LM/W IP65',
 'lampe-industrielle-led-cloche-150w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 150W très haute efficacité 160 lm/W. Protection IP65, flux lumineux 22800-24000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 150W',
 96.01,
 FALSE,
 FALSE,
 TRUE,
 7,
 '150W'),

('LAMPE INDUSTRIELLE LED CLOCHE 200W 160LM/W IP65',
 'lampe-industrielle-led-cloche-200w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 200W très haute efficacité 160 lm/W. Protection IP65, flux lumineux 30400-32000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 200W',
 109.51,
 FALSE,
 FALSE,
 TRUE,
 8,
 '200W'),

('LAMPE INDUSTRIELLE LED CLOCHE 100W/150W/200W',
 'lampe-industrielle-led-cloche-variable-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche réglable 100W/150W/200W. Très haute efficacité 160 lm/W. Protection IP65, flux lumineux 19000-40000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE VAR',
 131.96,
 FALSE,
 FALSE,
 TRUE,
 9,
 '100W/150W/200W'),

('LAMPE INDUSTRIELLE LED CLOCHE 100W 130LM/W DALI',
 'lampe-industrielle-led-cloche-100w-dali',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 100W avec pilotage DALI. Efficacité 130 lm/W, flux lumineux 13000 lm. Protection IP65. Garantie 5 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 100W DALI',
 77.50,
 FALSE,
 FALSE,
 TRUE,
 10,
 '100W'),

('LAMPE INDUSTRIELLE LED CLOCHE 240W 185LM/W CEE',
 'lampe-industrielle-led-cloche-240w-cee',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED cloche 240W très haute efficacité 185 lm/W. Protection IP65, flux lumineux 44400 lm. Éligible CEE. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL CLOCHE 240W CEE',
 106.63,
 FALSE,
 FALSE,
 TRUE,
 11,
 '240W'),

-- CLAREO LIGHTING - Lampes rack
('LAMPE INDUSTRIELLE LED RACK CLAREO 80W 160LM/W',
 'lampe-industrielle-led-rack-80w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED rack 80W très haute efficacité 160 lm/W. Éclairage linéaire suspendu, flux lumineux 12800 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL RACK 80W',
 175.58,
 FALSE,
 FALSE,
 TRUE,
 12,
 '80W'),

('LAMPE INDUSTRIELLE LED RACK CLAREO 120W 160LM/W',
 'lampe-industrielle-led-rack-120w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED rack 120W très haute efficacité 160 lm/W. Éclairage linéaire suspendu, flux lumineux 19200 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL RACK 120W',
 244.28,
 FALSE,
 FALSE,
 TRUE,
 13,
 '120W'),

('LAMPE INDUSTRIELLE LED RACK CLAREO 150W 160LM/W',
 'lampe-industrielle-led-rack-150w-clareo',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED rack 150W très haute efficacité 160 lm/W. Éclairage linéaire suspendu, flux lumineux 24000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL RACK 150W',
 259.80,
 FALSE,
 FALSE,
 TRUE,
 14,
 '150W'),

-- CLAREO LIGHTING - Lampes faible éblouissement
('LAMPE INDUSTRIELLE LED FAIBLE ÉBLOUISSEMENT 60W',
 'lampe-industrielle-led-faible-eblouissement-60w',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED à faible éblouissement 60W. Confort visuel optimal, flux lumineux 9600 lm. Garantie 5 ans.',
 'CLAREO LIGHTING',
 'CL FE 60W',
 134.49,
 FALSE,
 FALSE,
 TRUE,
 15,
 '60W'),

('LAMPE INDUSTRIELLE LED FAIBLE ÉBLOUISSEMENT 100W',
 'lampe-industrielle-led-faible-eblouissement-100w',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED à faible éblouissement 100W. Confort visuel optimal, flux lumineux 16000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL FE 100W',
 169.82,
 FALSE,
 FALSE,
 TRUE,
 16,
 '100W'),

('LAMPE INDUSTRIELLE LED FAIBLE ÉBLOUISSEMENT 150W',
 'lampe-industrielle-led-faible-eblouissement-150w',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED à faible éblouissement 150W. Confort visuel optimal, flux lumineux 24000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL FE 150W',
 310.67,
 FALSE,
 FALSE,
 TRUE,
 17,
 '150W'),

('LAMPE INDUSTRIELLE LED FAIBLE ÉBLOUISSEMENT 200W',
 'lampe-industrielle-led-faible-eblouissement-200w',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED à faible éblouissement 200W. Confort visuel optimal, flux lumineux 32000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL FE 200W',
 231.32,
 FALSE,
 FALSE,
 TRUE,
 18,
 '200W'),

('LAMPE INDUSTRIELLE LED FAIBLE ÉBLOUISSEMENT 300W',
 'lampe-industrielle-led-faible-eblouissement-300w',
 'lampes-industrielles',
 (SELECT id FROM public.categories WHERE slug = 'lampes-industrielles'),
 'Lampe industrielle LED à faible éblouissement 300W. Confort visuel optimal pour très grands volumes, flux lumineux 48000 lm. Garantie 7 ans.',
 'CLAREO LIGHTING',
 'CL FE 300W',
 568.97,
 FALSE,
 FALSE,
 TRUE,
 19,
 '300W')

ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  categorie = EXCLUDED.categorie,
  categorie_id = EXCLUDED.categorie_id,
  description = EXCLUDED.description,
  marque = EXCLUDED.marque,
  reference = EXCLUDED.reference,
  prix = EXCLUDED.prix,
  sur_devis = EXCLUDED.sur_devis,
  prime_cee = EXCLUDED.prime_cee,
  actif = EXCLUDED.actif,
  ordre = EXCLUDED.ordre,
  puissance = EXCLUDED.puissance;

-- ============================================
-- Vérification
-- ============================================
SELECT 
  'Catégorie Lampes industrielles créée' as status,
  COUNT(*) as nombre_produits
FROM public.products
WHERE categorie = 'lampes-industrielles' AND actif = true;

