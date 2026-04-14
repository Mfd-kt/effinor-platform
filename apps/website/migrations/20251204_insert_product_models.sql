-- ============================================
-- Migration: Insert product models
-- Date: 2025-12-04
-- Description:
--   Ajout de tous les modèles de produits demandés
-- ============================================

-- 1. Floodlight LED / Projecteur LED
INSERT INTO public.products (
  nom,
  slug,
  description,
  categorie,
  actif,
  sur_devis,
  prix,
  ordre
) VALUES
('Projecteur LED Floodlight 50W – IP65',
 'projecteur-led-floodlight-50w-ip65',
 'Projecteur LED Floodlight 50W avec protection IP65, idéal pour l''éclairage extérieur, parkings et zones industrielles. Haute efficacité énergétique et longue durée de vie.',
 'eclairage_exterieur',
 TRUE,
 FALSE,
 89.00,
 1),

('Projecteur LED Floodlight 100W – IP65',
 'projecteur-led-floodlight-100w-ip65',
 'Projecteur LED Floodlight 100W avec protection IP65, parfait pour l''éclairage de grandes surfaces extérieures, entrepôts et zones de chargement. Performance optimale et résistance aux intempéries.',
 'eclairage_exterieur',
 TRUE,
 FALSE,
 149.00,
 2),

('Projecteur LED Floodlight 150W – IP65',
 'projecteur-led-floodlight-150w-ip65',
 'Projecteur LED Floodlight 150W avec protection IP65, conçu pour l''éclairage intensif de zones industrielles, parkings et espaces extérieurs de grande taille. Puissance et efficacité maximales.',
 'eclairage_exterieur',
 TRUE,
 FALSE,
 199.00,
 3),

('Projecteur LED Floodlight 200W – IP65',
 'projecteur-led-floodlight-200w-ip65',
 'Projecteur LED Floodlight 200W avec protection IP65, solution haut de gamme pour l''éclairage professionnel de très grandes surfaces. Performance exceptionnelle et durabilité garantie.',
 'eclairage_exterieur',
 TRUE,
 FALSE,
 249.00,
 4),

-- 2. LED Panels / Panneaux LED
('Panneau LED 60×60 cm – 36W',
 'panneau-led-60x60-36w',
 'Panneau LED 60×60 cm, 36W, idéal pour l''éclairage tertiaire et bureaux. Design moderne, éclairage uniforme et haute qualité de lumière. Installation facile au plafond.',
 'eclairage_etanche',
 TRUE,
 FALSE,
 79.00,
 5),

('Panneau LED 30×120 cm – 40W',
 'panneau-led-30x120-40w',
 'Panneau LED 30×120 cm, 40W, parfait pour les espaces commerciaux et bureaux. Éclairage linéaire moderne, haute efficacité énergétique et confort visuel optimal.',
 'eclairage_etanche',
 TRUE,
 FALSE,
 89.00,
 6),

-- 3. Anti-Ammonia Tubes / Lumière LED étanche anti-ammoniac
('Lumière LED étanche anti-ammoniac pour volaille 9W',
 'led-etanche-anti-ammoniac-volaille-9w',
 'Lumière LED étanche anti-ammoniac 9W spécialement conçue pour les élevages avicoles. Résistance exceptionnelle à l''ammoniac, longue durée de vie et éclairage optimal pour le bien-être des volailles.',
 'eclairage_etanche',
 TRUE,
 FALSE,
 29.90,
 7),

('Lumière LED étanche anti-ammoniac pour volaille 18W',
 'led-etanche-anti-ammoniac-volaille-18w',
 'Lumière LED étanche anti-ammoniac 18W pour élevages avicoles. Protection renforcée contre l''ammoniac, performance élevée et économie d''énergie. Idéal pour les grands espaces d''élevage.',
 'eclairage_etanche',
 TRUE,
 FALSE,
 49.90,
 8),

('Lumière LED étanche anti-ammoniac pour volaille 24W',
 'led-etanche-anti-ammoniac-volaille-24w',
 'Lumière LED étanche anti-ammoniac 24W haute performance pour élevages avicoles. Résistance maximale à l''ammoniac, éclairage puissant et durable. Solution professionnelle pour l''élevage intensif.',
 'eclairage_etanche',
 TRUE,
 FALSE,
 69.90,
 9),

-- 4. Workshop Lamp / Lampe d''atelier
('Lampe d''atelier LED magnétique',
 'lampe-atelier-led-magnetique',
 'Lampe d''atelier LED avec fixation magnétique, idéale pour les travaux de précision et inspections. Aimant puissant, éclairage directionnel et autonomie longue durée. Parfaite pour mécaniciens et bricoleurs.',
 'accessoires',
 TRUE,
 FALSE,
 39.90,
 10),

('Lampe d''inspection LED',
 'lampe-inspection-led',
 'Lampe d''inspection LED professionnelle pour travaux de précision et contrôles qualité. Éclairage puissant et directionnel, design ergonomique et résistance aux chocs. Outil indispensable pour professionnels.',
 'accessoires',
 TRUE,
 FALSE,
 49.90,
 11),

-- 5. EV Charger / Borne de recharge
('Borne de recharge véhicule électrique 7 kW Type 2',
 'borne-recharge-ev-7kw-type2',
 'Borne de recharge pour véhicule électrique 7 kW, Type 2, idéale pour usage domestique. Installation simple, charge rapide et sécurisée. Compatible avec tous les véhicules électriques européens.',
 'borne-recharge-maison',
 TRUE,
 TRUE,
 NULL,
 12),

('Borne de recharge véhicule électrique 11 kW Type 2',
 'borne-recharge-ev-11kw-type2',
 'Borne de recharge pour véhicule électrique 11 kW, Type 2, parfaite pour copropriétés et petites entreprises. Charge rapide, gestion intelligente et suivi de consommation. Solution économique et performante.',
 'borne-recharge-pro',
 TRUE,
 TRUE,
 NULL,
 13),

('Borne de recharge véhicule électrique 22 kW Type 2',
 'borne-recharge-ev-22kw-type2',
 'Borne de recharge pour véhicule électrique 22 kW, Type 2, solution professionnelle pour entreprises et parkings publics. Charge ultra-rapide, gestion avancée et monitoring en temps réel. Performance maximale.',
 'borne-recharge-pro',
 TRUE,
 TRUE,
 NULL,
 14),

-- 6. Smart Load Balancer
('Gestionnaire de charge dynamique Smart Load Balancer',
 'smart-load-balancer',
 'Gestionnaire de charge dynamique pour bornes de recharge. Répartit intelligemment la puissance disponible entre plusieurs bornes, évite les surcharges et optimise l''utilisation électrique. Solution professionnelle pour installations multiples.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 15),

-- 7. EV Charging Cable / Câble de recharge
('Câble de recharge véhicule électrique 5m – 32A',
 'cable-recharge-ev-5m-32a',
 'Câble de recharge Type 2, longueur 5m, 32A, pour borne de recharge. Compatible tous véhicules électriques, section adaptée pour charge rapide. Idéal pour usage domestique.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 189.00,
 16),

('Câble de recharge véhicule électrique 7m – 32A',
 'cable-recharge-ev-7m-32a',
 'Câble de recharge Type 2, longueur 7m, 32A, pour borne de recharge. Flexibilité accrue pour parkings de copropriété. Haute qualité, résistant aux intempéries et aux manipulations.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 219.00,
 17),

('Câble de recharge véhicule électrique 10m – 32A',
 'cable-recharge-ev-10m-32a',
 'Câble de recharge Type 2, longueur 10m, 32A, pour borne de recharge. Longueur maximale pour situations complexes. Parfait pour parkings avec contraintes d''espace.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 249.00,
 18),

('Câble de recharge véhicule électrique Spiral – 32A',
 'cable-recharge-ev-spiral-32a',
 'Câble de recharge Type 2, format spiral, 32A, pour borne de recharge. Design compact et pratique, s''étend jusqu''à 5m. Facilite le rangement et évite les enchevêtrements.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 199.00,
 19),

-- 8. EV Accessories / Accessoires borne de recharge
('Support mural pour câble de recharge',
 'support-mural-cable-recharge',
 'Support mural design pour ranger proprement le câble de recharge à côté de la borne. Fixation murale solide, résistant aux intempéries. Améliore l''esthétique et la praticité de l''installation.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 39.90,
 20),

('Socle sur pied pour borne de recharge',
 'socle-pied-borne-recharge',
 'Socle sur pied pour installation de borne de recharge en parking extérieur. Installation rapide, résistance aux intempéries et stabilité garantie. Solution idéale pour parkings sans mur disponible.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 21),

('Protection pluie pour borne de recharge',
 'protection-pluie-borne-recharge',
 'Protection pluie pour borne de recharge, protège l''équipement des intempéries. Design aérodynamique, installation simple et résistance aux UV. Prolonge la durée de vie de la borne.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 89.00,
 22),

-- 9. Protection Electrical / Protection électrique
('Disjoncteur 40A pour borne de recharge',
 'disjoncteur-40a-borne-recharge',
 'Disjoncteur 40A spécialement conçu pour installations de bornes de recharge. Protection contre les surcharges et courts-circuits. Conforme aux normes électriques en vigueur.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 23),

('Disjoncteur 63A pour borne de recharge',
 'disjoncteur-63a-borne-recharge',
 'Disjoncteur 63A haute performance pour installations de bornes de recharge professionnelles. Protection renforcée pour charges élevées. Sécurité maximale pour installations multiples.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 24),

('Interrupteur différentiel 30mA Type A pour borne de recharge',
 'interrupteur-differentiel-30ma-typea',
 'Interrupteur différentiel 30mA Type A pour protection des personnes et équipements de recharge. Détection des fuites de courant, sécurité maximale. Conforme normes NF EN 61008.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 25)

ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  categorie = EXCLUDED.categorie,
  prix = EXCLUDED.prix,
  ordre = EXCLUDED.ordre;

-- Commentaires pour documentation
COMMENT ON TABLE public.products IS
  'Table des produits du catalogue, incluant les projecteurs LED, panneaux LED, lumières anti-ammoniac, lampes d''atelier, bornes de recharge et accessoires associés';














