-- ============================================
-- Migration: Enrichir et ajouter des catégories
-- ============================================
-- Date: 2025-12-04
-- Description: Insère ou met à jour des catégories avec descriptions complètes et images
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'categories'
  ) THEN
    RAISE EXCEPTION 'La table categories n''existe pas. Exécutez d''abord la création de la table.';
  END IF;
END $$;

-- ============================================
-- Catégories principales
-- ============================================

-- 1. Highbay LED
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
  'Highbay LED',
  'highbay-led',
  'Solutions d''éclairage LED haute performance pour halls industriels, entrepôts et grands volumes. Éclairage uniforme et puissant adapté aux hauteurs importantes.',
  'Les Highbay LED Effinor sont conçus pour les environnements industriels exigeants. Avec une efficacité lumineuse exceptionnelle jusqu''à 200 lm/W, ces luminaires offrent un éclairage uniforme sur de grandes surfaces avec des hauteurs sous plafond importantes (6 à 15 mètres).

**Pourquoi choisir nos Highbay LED ?**

✅ **Performance exceptionnelle** : Efficacité jusqu''à 200 lm/W, garantissant des économies d''énergie jusqu''à 80% par rapport aux solutions halogènes ou sodium.

✅ **Résistance optimale** : Protection IP65+ et IK08 pour résister aux environnements difficiles (poussière, vibrations, variations de température).

✅ **Durée de vie longue** : 50 000 heures de fonctionnement minimum, réduisant considérablement les coûts de maintenance.

✅ **Installation simplifiée** : Design compact et léger facilitant l''installation et le remplacement des anciens systèmes.

✅ **Conformité garantie** : Tous nos Highbay LED sont certifiés CE, conformes aux normes européennes et éligibles aux primes CEE.

Ideal pour : Entrepôts logistiques, halls industriels, ateliers de production, centres de distribution, plateformes logistiques.',
  1,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 2. Projecteur LED / Floodlight
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
  'Projecteur LED / Floodlight',
  'projecteur-led-floodlight',
  'Projecteurs LED haute puissance pour éclairage extérieur, parkings, cours et façades. Protection IP65+ et résistance aux intempéries.',
  'Nos projecteurs LED Floodlight sont spécialement conçus pour l''éclairage extérieur professionnel. Avec des puissances allant de 50W à 500W, ils offrent un éclairage puissant et directionnel adapté aux grandes surfaces extérieures.

**Pourquoi choisir nos Projecteurs LED Floodlight ?**

✅ **Résistance maximale** : Protection IP65+ garantissant une étanchéité parfaite contre la pluie, la neige et les intempéries. Résistance aux températures extrêmes (-30°C à +50°C).

✅ **Éclairage directionnel** : Optiques adaptables permettant un éclairage ciblé selon vos besoins (large, moyen, étroit).

✅ **Détection intelligente** : Compatible avec détecteurs de présence et de mouvement pour optimiser la consommation énergétique.

✅ **Installation flexible** : Montage sur poteau, mur ou plafond avec différents angles d''inclinaison.

✅ **Économies significatives** : Jusqu''à 75% d''économies d''énergie par rapport aux projecteurs halogènes traditionnels.

Ideal pour : Parkings extérieurs, cours d''usine, façades de bâtiments, espaces publics, zones de chargement, éclairage de sécurité.',
  2,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 3. Réglettes LED
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
  'Réglettes LED',
  'reglettes-led',
  'Solutions d''éclairage LED linéaire pour bureaux, ateliers et espaces tertiaires. Confort visuel optimal et design moderne.',
  'Les réglettes LED Effinor offrent un éclairage linéaire uniforme et performant, idéal pour les espaces de travail modernes. Disponibles en différentes longueurs (60cm, 120cm, 150cm) et puissances, elles s''adaptent à tous vos besoins d''éclairage.

**Pourquoi choisir nos Réglettes LED ?**

✅ **Confort visuel optimal** : IRC > 90 garantissant un rendu des couleurs naturel et agréable, réduisant la fatigue visuelle.

✅ **Design moderne** : Profil fin et discret s''intégrant parfaitement dans les plafonds suspendus ou en saillie.

✅ **Flexibilité d''installation** : Installation en saillie, encastrée ou suspendue selon vos contraintes architecturales.

✅ **Gradation intelligente** : Compatible avec systèmes DALI et variateurs pour adapter l''éclairage à la lumière du jour.

✅ **Maintenance facilitée** : Accès facile aux composants pour un remplacement rapide sans démontage complet.

✅ **Économies d''énergie** : Jusqu''à 60% d''économies par rapport aux tubes fluorescents traditionnels.

Ideal pour : Bureaux, open spaces, salles de réunion, ateliers, espaces tertiaires, établissements scolaires, hôpitaux.',
  3,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 4. Panneaux LED
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
  'Panneaux LED',
  'panneaux-led',
  'Panneaux LED plats pour éclairage général des bureaux et espaces tertiaires. Éclairage uniforme et design épuré.',
  'Les panneaux LED Effinor offrent un éclairage uniforme et performant pour tous vos espaces tertiaires. Disponibles en formats standards (60x60cm, 30x120cm, 60x120cm), ils remplacent facilement les anciens plafonniers fluorescents.

**Pourquoi choisir nos Panneaux LED ?**

✅ **Éclairage uniforme** : Diffusion homogène de la lumière sans zones d''ombre, garantissant un confort visuel optimal.

✅ **Installation simplifiée** : Compatible avec les systèmes de plafond suspendu standards (Armstrong, etc.), installation en quelques minutes.

✅ **Design épuré** : Profil ultra-fin (moins de 2cm) pour un design moderne et discret.

✅ **Performance énergétique** : Efficacité jusqu''à 130 lm/W, réduisant la consommation jusqu''à 50% par rapport aux plafonniers fluorescents.

✅ **Confort visuel** : IRC > 80 et anti-éblouissement pour un environnement de travail agréable.

✅ **Durabilité** : Durée de vie 50 000 heures, réduisant les coûts de maintenance.

Ideal pour : Bureaux, open spaces, salles de réunion, couloirs, espaces d''accueil, établissements scolaires.',
  4,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 5. Spots LED
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
  'Spots LED',
  'spots-led',
  'Spots LED directionnels pour mise en valeur, éclairage d''accentuation et éclairage commercial. Design moderne et performance optimale.',
  'Nos spots LED offrent un éclairage directionnel précis et performant, idéal pour mettre en valeur vos produits, espaces ou éléments architecturaux. Disponibles en différentes puissances (5W à 50W) et angles d''ouverture (15° à 120°).

**Pourquoi choisir nos Spots LED ?**

✅ **Éclairage directionnel précis** : Optiques adaptables permettant un éclairage ciblé et contrôlé selon vos besoins.

✅ **Rendu des couleurs exceptionnel** : IRC > 90 pour un rendu optimal des couleurs, essentiel pour la mise en valeur des produits.

✅ **Design moderne** : Profil fin et discret s''intégrant parfaitement dans les plafonds suspendus ou en saillie.

✅ **Flexibilité d''orientation** : Réglage de l''angle d''éclairage pour adapter la lumière à chaque situation.

✅ **Économies d''énergie** : Jusqu''à 80% d''économies par rapport aux spots halogènes traditionnels.

✅ **Durée de vie longue** : 30 000 à 50 000 heures selon le modèle, réduisant les coûts de remplacement.

Ideal pour : Magasins, showrooms, restaurants, hôtels, musées, galeries, éclairage d''accentuation, mise en valeur de produits.',
  5,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 6. Accessoires & Pilotage
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
  'Accessoires & Pilotage',
  'accessoires-pilotage',
  'Drivers LED, détecteurs de présence, variateurs et solutions de pilotage intelligent pour optimiser votre installation d''éclairage.',
  'Complétez votre installation LED avec nos accessoires et solutions de pilotage intelligent. De la détection de présence aux systèmes de gradation avancés, optimisez votre consommation énergétique et votre confort d''utilisation.

**Pourquoi choisir nos Accessoires & Pilotage ?**

✅ **Optimisation énergétique** : Détecteurs de présence et systèmes de gradation permettant des économies supplémentaires jusqu''à 30%.

✅ **Confort d''utilisation** : Gradation automatique selon la lumière du jour et adaptation à vos besoins réels.

✅ **Pilotage centralisé** : Systèmes DALI et bus pour contrôler toute votre installation depuis un point unique.

✅ **Intégration domotique** : Compatible avec les systèmes domotiques standards pour une intégration complète.

✅ **Drivers haute performance** : Drivers LED certifiés garantissant une durée de vie optimale de vos luminaires.

✅ **Installation simplifiée** : Solutions plug-and-play pour une installation rapide et sans complexité.

Ideal pour : Toutes installations LED nécessitant un pilotage intelligent, optimisation énergétique, intégration domotique.',
  6,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 7. Éclairage Extérieur IP65+
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
  'Éclairage Extérieur IP65+',
  'eclairage-exterieur-ip65',
  'Solutions d''éclairage LED étanches pour extérieur. Protection IP65+ et résistance aux intempéries pour tous vos projets extérieurs.',
  'Notre gamme d''éclairage extérieur IP65+ est conçue pour résister aux conditions climatiques les plus difficiles. De l''éclairage de sécurité aux applications architecturales, trouvez la solution adaptée à vos besoins extérieurs.

**Pourquoi choisir notre Éclairage Extérieur IP65+ ?**

✅ **Étanchéité garantie** : Protection IP65+ et IP66 pour une résistance totale à l''eau, à la poussière et aux intempéries.

✅ **Résistance aux températures** : Fonctionnement garanti de -30°C à +50°C, adapté à tous les climats.

✅ **Résistance aux UV** : Matériaux résistants aux UV pour une durabilité maximale en extérieur.

✅ **Éclairage performant** : Puissances adaptées de 20W à 500W pour éclairer efficacement tous vos espaces extérieurs.

✅ **Installation robuste** : Fixations renforcées et matériaux anti-corrosion pour une installation durable.

✅ **Économies d''énergie** : Jusqu''à 70% d''économies par rapport aux solutions extérieures traditionnelles.

Ideal pour : Parkings extérieurs, cours d''usine, façades de bâtiments, éclairage de sécurité, espaces publics, zones de chargement, éclairage architectural.',
  7,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- 8. Éclairage Industriel
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
  'Éclairage Industriel',
  'eclairage-industriel',
  'Solutions d''éclairage LED robustes et performantes pour environnements industriels exigeants. Résistance aux vibrations, poussière et températures élevées.',
  'Notre gamme d''éclairage industriel est spécialement conçue pour répondre aux exigences des environnements industriels les plus difficiles. Haute performance, robustesse et durabilité sont au cœur de nos solutions.

**Pourquoi choisir notre Éclairage Industriel ?**

✅ **Robustesse maximale** : Protection IP65+ et IK08+ pour résister aux chocs, vibrations et environnements difficiles.

✅ **Résistance thermique** : Fonctionnement garanti jusqu''à 50°C ambiant, adapté aux ateliers et zones de production.

✅ **Performance lumineuse** : Efficacité jusqu''à 200 lm/W pour un éclairage puissant et uniforme sur grandes surfaces.

✅ **Maintenance réduite** : Durée de vie 50 000 heures minimum, réduisant les interventions en hauteur.

✅ **Conformité sécurité** : Certifié pour environnements ATEX si nécessaire, garantissant la sécurité de vos installations.

✅ **ROI rapide** : Retour sur investissement généralement inférieur à 2 ans grâce aux économies d''énergie.

Ideal pour : Usines de production, ateliers industriels, zones de stockage, chaînes de montage, environnements ATEX, zones à température élevée.',
  8,
  true,
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  description_longue = EXCLUDED.description_longue,
  images = EXCLUDED.images;

-- ============================================
-- Vérification
-- ============================================

SELECT 
  COUNT(*) as total_categories,
  COUNT(CASE WHEN actif = true THEN 1 END) as categories_actives,
  COUNT(CASE WHEN description_longue IS NOT NULL THEN 1 END) as categories_enrichies
FROM public.categories;

-- Afficher les catégories créées
SELECT 
  ordre,
  nom,
  slug,
  CASE WHEN description_longue IS NOT NULL THEN '✅' ELSE '❌' END as enrichie,
  actif
FROM public.categories
ORDER BY ordre;

