-- ============================================
-- Migration: Insert 20 product accessories
-- Date: 2025-12-04
-- Description:
--   Création de 20 produits accessoires :
--   - 10 accessoires pour luminaires (catégorie: accessoires)
--   - 10 accessoires pour bornes de recharge (catégorie: accessoires_borne_recharge)
-- ============================================

-- 1. Accessoires pour luminaires (10 produits)
INSERT INTO public.products (
  nom,
  slug,
  description,
  categorie,
  actif,
  sur_devis,
  prix,
  image_url,
  ordre
) VALUES
-- Accessoires pour luminaires
('Kit de suspension pour Highbay',
 'acc-kit-suspension-highbay',
 'Kit complet de câbles acier et crochets pour suspendre vos Highbay LED en toute sécurité. Résistance jusqu''à 50kg, installation rapide.',
 'accessoires',
 TRUE,
 FALSE,
 39.90,
 NULL,
 1),

('Support orientable pour projecteur LED',
 'acc-support-orientable-projecteur',
 'Support mural orientable pour projecteurs LED, idéal pour parkings, façades et zones de chargement. Angle d''inclinaison 0-180°.',
 'accessoires',
 TRUE,
 FALSE,
 29.90,
 NULL,
 2),

('Grille anti-éblouissement pour réglettes',
 'acc-grille-anti-eblouissement-reglette',
 'Grille de protection pour réduire l''éblouissement des réglettes LED dans les zones tertiaires. Compatible toutes largeurs.',
 'accessoires',
 TRUE,
 FALSE,
 19.90,
 NULL,
 3),

('Capteur de présence plafond HF',
 'acc-capteur-presence-plafond-hf',
 'Capteur de présence haute fréquence pour pilotage automatique de l''éclairage en entrepôts et circulations. Portée 12m, angle 360°.',
 'accessoires',
 TRUE,
 FALSE,
 69.00,
 NULL,
 4),

('Capteur de luminosité pour gradation',
 'acc-capteur-luminosite-gradation',
 'Cellule de mesure de lumière naturelle pour ajuster automatiquement le flux des luminaires LED. Réglage de seuil intégré.',
 'accessoires',
 TRUE,
 FALSE,
 59.00,
 NULL,
 5),

('Boîtier de commande DALI',
 'acc-boitier-commande-dali',
 'Contrôleur DALI pour gérer plusieurs lignes de luminaires en gradation et scénarios horaires. Jusqu''à 64 appareils par ligne.',
 'accessoires',
 TRUE,
 TRUE,
 NULL,
 NULL,
 6),

('Boîtier de commande 1-10V',
 'acc-boitier-commande-1-10v',
 'Module de pilotage 1-10V pour gradation simple de vos luminaires industriels ou tertiaires. Compatible tous drivers 1-10V.',
 'accessoires',
 TRUE,
 FALSE,
 79.00,
 NULL,
 7),

('Kit de jonction étanche IP65',
 'acc-kit-jonction-etanche-ip65',
 'Kit de connexion rapide IP65 pour relier plusieurs luminaires étanches en ligne continue. Protection contre l''eau et la poussière.',
 'accessoires',
 TRUE,
 FALSE,
 24.90,
 NULL,
 8),

('Étriers de fixation pour réglettes',
 'acc-etriers-fixation-reglettes',
 'Jeu d''étriers métalliques pour fixation murale ou plafond de réglettes LED. 2 étriers par jeu, visserie incluse.',
 'accessoires',
 TRUE,
 FALSE,
 14.90,
 NULL,
 9),

('Kit de secours LED 1h',
 'acc-kit-secours-led-1h',
 'Module de secours 1h pour assurer un éclairage de sécurité sur vos luminaires stratégiques. Conformité NF EN 60598-2-22.',
 'accessoires',
 TRUE,
 TRUE,
 NULL,
 NULL,
 10)

ON CONFLICT (slug) DO NOTHING;

-- 2. Accessoires pour bornes de recharge (10 produits)
INSERT INTO public.products (
  nom,
  slug,
  description,
  categorie,
  actif,
  sur_devis,
  prix,
  image_url,
  ordre
) VALUES
-- Accessoires pour bornes de recharge
('Câble de recharge Type 2 - 5m',
 'acc-cable-type2-5m',
 'Câble de recharge Type 2, longueur 5m, idéal pour borne murale en maison individuelle. Compatible toutes voitures électriques.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 189.00,
 NULL,
 1),

('Câble de recharge Type 2 - 7m',
 'acc-cable-type2-7m',
 'Câble de recharge Type 2, longueur 7m pour plus de flexibilité sur parkings de copropriété. Section 3x2.5mm², IP44.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 219.00,
 NULL,
 2),

('Support mural pour câble de recharge',
 'acc-support-mural-cable',
 'Support mural design pour ranger proprement le câble de recharge à côté de la borne. Fixation murale, résistant aux intempéries.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 39.90,
 NULL,
 3),

('Socle de fixation pour borne sur pied',
 'acc-socle-pied-borne',
 'Socle métallique pour installation de borne de recharge sur pied en parking extérieur. Bétonné ou vissé au sol.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 NULL,
 4),

('Kit de protection mécanique pour borne',
 'acc-kit-protection-borne',
 'Arceaux et butées de protection pour sécuriser la borne contre les chocs de véhicules. Installation rapide, résistant aux chocs.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 NULL,
 5),

('Badge RFID supplémentaire',
 'acc-badge-rfid-supplementaire',
 'Badge RFID supplémentaire pour l''authentification utilisateur sur borne de recharge Pro. Jusqu''à 10 badges par borne.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 14.90,
 NULL,
 6),

('Totem signalétique borne de recharge',
 'acc-totem-signalétique-borne',
 'Totem signalétique pour repérer facilement les emplacements de recharge sur parking. Hauteur 1.5m, résistant aux intempéries.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 NULL,
 7),

('Kit de gestion dynamique de puissance',
 'acc-kit-gestion-puissance',
 'Module de gestion de puissance pour adapter la charge en fonction de la disponibilité électrique du site. Évite les surcharges.',
 'accessoires_borne_recharge',
 TRUE,
 TRUE,
 NULL,
 NULL,
 8),

('Kit de verrouillage prise pour copropriété',
 'acc-kit-verrouillage-prise',
 'Système de verrouillage de prise pour sécuriser l''usage des bornes en copropriété. Serrure à clé ou badge RFID.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 89.00,
 NULL,
 9),

('Kit de trappe / cache pour câblage',
 'acc-kit-trappe-cache-cablage',
 'Kit de finition pour cacher et protéger les câbles d''alimentation des bornes de recharge. Esthétique et sécurisé.',
 'accessoires_borne_recharge',
 TRUE,
 FALSE,
 49.90,
 NULL,
 10)

ON CONFLICT (slug) DO NOTHING;

-- 3. Commentaires pour documentation
COMMENT ON TABLE public.products IS
  'Table des produits du catalogue, incluant les accessoires pour luminaires et bornes de recharge';














