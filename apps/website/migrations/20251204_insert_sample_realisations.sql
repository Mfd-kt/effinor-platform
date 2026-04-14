-- Insertion de 10 réalisations de test
-- Exécuter après avoir créé la table realisations

INSERT INTO realisations (
  slug,
  titre,
  client,
  secteur,
  ville,
  pays,
  description_courte,
  contexte,
  solution,
  resultats,
  economie_energie_pct,
  produits_utilises,
  images,
  published_at,
  status,
  seo_title,
  seo_description,
  seo_og_image_url,
  created_at,
  updated_at
) VALUES
-- Réalisation 1: Entrepôt logistique
(
  'renovation-eclairage-entrepot-logistique-paris',
  'Rénovation d''éclairage LED pour entrepôt logistique',
  'LogiStore France',
  'Logistique',
  'Paris',
  'France',
  'Remplacement complet de l''éclairage halogène par des Highbay LED 150W pour un entrepôt de 5000 m².',
  'L''entrepôt de LogiStore France nécessitait une rénovation complète de son système d''éclairage. L''ancien système halogène consommait énormément d''énergie et nécessitait un entretien fréquent. Les zones de stockage et de préparation de commandes manquaient de luminosité uniforme.',
  'Installation de 120 Highbay LED 150W avec un flux lumineux de 20 000 lm chacun. Les luminaires sont équipés de détecteurs de présence pour optimiser la consommation. L''éclairage est réparti uniformément sur toute la surface avec un éclairement moyen de 300 lux.',
  'Réduction de 65% de la consommation énergétique. Amélioration significative de la qualité de l''éclairage avec un IRC > 80. Diminution des accidents liés à la mauvaise visibilité. Retour sur investissement en 2,5 ans grâce aux économies d''énergie et aux CEE.',
  65,
  '["Highbay LED 150W", "Détecteurs de présence", "Pilotage DALI"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '30 days',
  'published',
  'Rénovation LED entrepôt logistique Paris - 65% d''économies',
  'Rénovation complète de l''éclairage d''un entrepôt logistique de 5000 m² avec Highbay LED. Réduction de 65% de la consommation énergétique.',
  NULL,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
),

-- Réalisation 2: Bureaux tertiaire
(
  'renovation-eclairage-bureaux-tertiaire-lyon',
  'Rénovation LED pour bureaux tertiaires',
  'TechCorp Solutions',
  'Tertiaire',
  'Lyon',
  'France',
  'Remplacement de l''éclairage fluorescent par des réglettes LED pour 2000 m² de bureaux.',
  'Les bureaux de TechCorp Solutions utilisaient un éclairage fluorescent obsolète qui causait de la fatigue visuelle et une consommation énergétique élevée. Les employés se plaignaient de maux de tête et de fatigue oculaire.',
  'Installation de 350 réglettes LED 36W avec variateur de luminosité. Système de pilotage intelligent avec détection de présence et adaptation automatique à la lumière du jour. Éclairage uniforme avec un éclairement de 500 lux sur les postes de travail.',
  'Réduction de 55% de la consommation d''énergie. Amélioration du confort visuel avec un IRC > 90. Diminution des arrêts maladie liés à la fatigue visuelle. Satisfaction des employés en hausse de 40%.',
  55,
  '["Réglettes LED 36W", "Variateurs DALI", "Détecteurs de présence"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '25 days',
  'published',
  'Rénovation LED bureaux Lyon - 55% d''économies d''énergie',
  'Rénovation complète de l''éclairage LED pour bureaux tertiaires. Réduction de 55% de la consommation et amélioration du confort visuel.',
  NULL,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
),

-- Réalisation 3: Grande surface retail
(
  'renovation-eclairage-grande-surface-retail-marseille',
  'Rénovation LED pour grande surface retail',
  'SuperMarché Plus',
  'Retail',
  'Marseille',
  'France',
  'Remplacement complet de l''éclairage pour un supermarché de 3000 m² avec projecteurs LED.',
  'Le supermarché SuperMarché Plus souhaitait moderniser son éclairage pour améliorer la présentation des produits et réduire sa facture énergétique. L''ancien système consommait beaucoup et ne mettait pas en valeur les produits.',
  'Installation de 200 projecteurs LED 50W avec optiques adaptées pour chaque zone (rayons frais, épicerie, boulangerie). Éclairage accentué sur les présentoirs avec des spots LED 20W. Système de gradation pour adapter l''éclairage selon les heures d''ouverture.',
  'Réduction de 60% de la consommation énergétique. Amélioration de la présentation des produits avec un meilleur rendu des couleurs (IRC > 90). Augmentation des ventes de 8% grâce à une meilleure mise en valeur des produits.',
  60,
  '["Projecteurs LED 50W", "Spots LED 20W", "Optiques adaptatives"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '20 days',
  'published',
  'Rénovation LED grande surface Marseille - 60% d''économies',
  'Rénovation complète de l''éclairage LED pour grande surface retail. Réduction de 60% de la consommation et amélioration des ventes.',
  NULL,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
),

-- Réalisation 4: Usine industrielle
(
  'renovation-eclairage-usine-industrielle-lille',
  'Rénovation LED pour usine de production',
  'Industrie Métal Pro',
  'Industrie',
  'Lille',
  'France',
  'Rénovation complète de l''éclairage d''une usine de 8000 m² avec Highbay LED haute performance.',
  'L''usine Industrie Métal Pro nécessitait un éclairage performant pour ses lignes de production. L''ancien système à vapeur de sodium consommait énormément et nécessitait un éclairage d''appoint pour les zones de précision.',
  'Installation de 180 Highbay LED 200W avec un flux lumineux de 25 000 lm. Éclairage renforcé sur les postes de travail avec des réglettes LED supplémentaires. Système résistant aux vibrations et aux températures élevées.',
  'Réduction de 70% de la consommation énergétique. Amélioration de la sécurité avec un éclairement de 500 lux sur les postes de travail. Diminution des erreurs de production grâce à une meilleure visibilité. Retour sur investissement en 2 ans.',
  70,
  '["Highbay LED 200W", "Réglettes LED industrielles", "Protection IP65"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '18 days',
  'published',
  'Rénovation LED usine industrielle Lille - 70% d''économies',
  'Rénovation complète de l''éclairage LED pour usine industrielle. Réduction de 70% de la consommation et amélioration de la sécurité.',
  NULL,
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
),

-- Réalisation 5: Parking extérieur
(
  'renovation-eclairage-parking-exterieur-toulouse',
  'Rénovation LED pour parking extérieur',
  'Centre Commercial Les Halles',
  'Parking',
  'Toulouse',
  'France',
  'Remplacement de l''éclairage au sodium par des projecteurs LED IP65 pour un parking de 150 places.',
  'Le parking du centre commercial nécessitait une rénovation complète de son éclairage extérieur. L''ancien système au sodium consommait beaucoup et nécessitait un entretien fréquent. La sécurité était également un enjeu important.',
  'Installation de 45 projecteurs LED 100W IP65 avec détection de mouvement. Éclairage adaptatif qui s''intensifie en présence de véhicules ou de piétons. Système résistant aux intempéries et aux variations de température.',
  'Réduction de 75% de la consommation énergétique. Amélioration de la sécurité avec un éclairage uniforme et adaptatif. Diminution des actes de vandalisme grâce à un meilleur éclairage. Retour sur investissement en 1,8 an.',
  75,
  '["Projecteurs LED 100W IP65", "Détecteurs de mouvement", "Pilotage intelligent"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '15 days',
  'published',
  'Rénovation LED parking extérieur Toulouse - 75% d''économies',
  'Rénovation complète de l''éclairage LED pour parking extérieur. Réduction de 75% de la consommation et amélioration de la sécurité.',
  NULL,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
),

-- Réalisation 6: École primaire
(
  'renovation-eclairage-ecole-primaire-nantes',
  'Rénovation LED pour école primaire',
  'École Primaire Victor Hugo',
  'Collectivités',
  'Nantes',
  'France',
  'Rénovation complète de l''éclairage LED pour une école primaire de 1500 m².',
  'L''école primaire Victor Hugo souhaitait moderniser son éclairage pour améliorer le confort des élèves et réduire sa facture énergétique. L''ancien système fluorescent causait de la fatigue visuelle.',
  'Installation de 120 réglettes LED 36W avec variateur de luminosité dans toutes les salles de classe. Éclairage adaptatif qui s''ajuste selon la lumière naturelle. Système de pilotage centralisé pour optimiser la consommation.',
  'Réduction de 50% de la consommation énergétique. Amélioration du confort visuel pour les élèves et enseignants. Diminution de la fatigue oculaire. Conformité aux normes d''éclairage pour établissements scolaires.',
  50,
  '["Réglettes LED 36W", "Variateurs DALI", "Détection lumière du jour"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '12 days',
  'published',
  'Rénovation LED école primaire Nantes - 50% d''économies',
  'Rénovation complète de l''éclairage LED pour école primaire. Réduction de 50% de la consommation et amélioration du confort visuel.',
  NULL,
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),

-- Réalisation 7: Hôpital
(
  'renovation-eclairage-hopital-strasbourg',
  'Rénovation LED pour établissement de santé',
  'CHU de Strasbourg',
  'Santé',
  'Strasbourg',
  'France',
  'Rénovation complète de l''éclairage LED pour un service hospitalier de 2500 m².',
  'Le CHU de Strasbourg souhaitait moderniser l''éclairage de son service de chirurgie pour améliorer les conditions de travail du personnel médical et réduire la consommation énergétique.',
  'Installation de 200 réglettes LED médicales 40W avec un IRC > 95 pour un rendu des couleurs optimal. Éclairage adaptatif dans les chambres avec variateur. Système de pilotage intelligent pour optimiser la consommation selon les horaires.',
  'Réduction de 45% de la consommation énergétique. Amélioration des conditions de travail du personnel médical. Meilleur rendu des couleurs pour les diagnostics. Conformité aux normes d''éclairage pour établissements de santé.',
  45,
  '["Réglettes LED médicales 40W", "Variateurs DALI", "Pilotage intelligent"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '10 days',
  'published',
  'Rénovation LED hôpital Strasbourg - 45% d''économies',
  'Rénovation complète de l''éclairage LED pour établissement de santé. Réduction de 45% de la consommation et amélioration des conditions de travail.',
  NULL,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- Réalisation 8: Gymnase
(
  'renovation-eclairage-gymnase-bordeaux',
  'Rénovation LED pour gymnase sportif',
  'Complexe Sportif Municipal',
  'Collectivités',
  'Bordeaux',
  'France',
  'Rénovation complète de l''éclairage LED pour un gymnase de 1200 m².',
  'Le complexe sportif municipal souhaitait moderniser l''éclairage de son gymnase principal pour améliorer les conditions d''entraînement et réduire la consommation énergétique.',
  'Installation de 60 Highbay LED 150W avec un éclairement uniforme de 500 lux sur toute la surface. Éclairage adaptatif avec gradation selon les activités. Système résistant aux chocs et aux vibrations.',
  'Réduction de 65% de la consommation énergétique. Amélioration des conditions d''entraînement avec un éclairage uniforme. Diminution de la fatigue visuelle pour les sportifs. Retour sur investissement en 2,2 ans.',
  65,
  '["Highbay LED 150W", "Gradation DALI", "Protection IK08"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '8 days',
  'published',
  'Rénovation LED gymnase Bordeaux - 65% d''économies',
  'Rénovation complète de l''éclairage LED pour gymnase sportif. Réduction de 65% de la consommation et amélioration des conditions d''entraînement.',
  NULL,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
),

-- Réalisation 9: Atelier mécanique
(
  'renovation-eclairage-atelier-mecanique-nice',
  'Rénovation LED pour atelier mécanique',
  'AutoService Pro',
  'Industrie',
  'Nice',
  'France',
  'Rénovation complète de l''éclairage LED pour un atelier mécanique de 1000 m².',
  'L''atelier mécanique AutoService Pro nécessitait un éclairage performant pour les travaux de précision. L''ancien système consommait beaucoup et ne fournissait pas assez de lumière sur les postes de travail.',
  'Installation de 80 Highbay LED 120W avec un flux lumineux de 18 000 lm. Éclairage renforcé sur les postes de travail avec des lampes LED portatives. Système résistant aux huiles et aux produits chimiques.',
  'Réduction de 68% de la consommation énergétique. Amélioration de la précision des travaux grâce à un meilleur éclairage. Diminution des erreurs et des retouches. Retour sur investissement en 2 ans.',
  68,
  '["Highbay LED 120W", "Lampes LED portatives", "Protection IP54"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '5 days',
  'published',
  'Rénovation LED atelier mécanique Nice - 68% d''économies',
  'Rénovation complète de l''éclairage LED pour atelier mécanique. Réduction de 68% de la consommation et amélioration de la précision des travaux.',
  NULL,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),

-- Réalisation 10: Magasin de vêtements
(
  'renovation-eclairage-magasin-vetements-rennes',
  'Rénovation LED pour magasin de vêtements',
  'Mode & Style',
  'Retail',
  'Rennes',
  'France',
  'Rénovation complète de l''éclairage LED pour un magasin de vêtements de 800 m².',
  'Le magasin Mode & Style souhaitait moderniser son éclairage pour mieux mettre en valeur ses collections et réduire sa facture énergétique. L''ancien système ne rendait pas justice aux couleurs des vêtements.',
  'Installation de 150 spots LED 15W avec un IRC > 90 pour un rendu optimal des couleurs. Éclairage accentué sur les vitrines et les présentoirs. Système de gradation pour créer des ambiances selon les collections.',
  'Réduction de 55% de la consommation énergétique. Amélioration de la présentation des produits avec un meilleur rendu des couleurs. Augmentation des ventes de 12% grâce à une meilleure mise en valeur. Retour sur investissement en 1,5 an.',
  55,
  '["Spots LED 15W", "Variateurs DALI", "Optiques adaptatives"]'::jsonb,
  '[]'::jsonb,
  NOW() - INTERVAL '3 days',
  'published',
  'Rénovation LED magasin vêtements Rennes - 55% d''économies',
  'Rénovation complète de l''éclairage LED pour magasin de vêtements. Réduction de 55% de la consommation et augmentation des ventes de 12%.',
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- Vérification des insertions
SELECT 
  COUNT(*) as total_realisations,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
  AVG(economie_energie_pct) as moyenne_economie_pct
FROM realisations;














