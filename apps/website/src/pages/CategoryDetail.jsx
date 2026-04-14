import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageGallery from '@/components/ImageGallery';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { ArrowRight, CheckCircle2, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAccessoriesForCategory, getProductsBySector } from '@/lib/api/products';

// Données pour chaque catégorie
const categoryData = {
  // Produits & Solutions (slugs historiques — contenu aligné PAC / déstratification / CEE)
  'luminaires-industrie-entrepots': {
    title: 'Industrie & entrepôts — chauffage et volumes',
    parentPath: '/produits-solutions',
    parentLabel: 'Produits & Solutions',
    heroTitle: 'Pompe à chaleur et déstratification pour sites industriels et logistiques',
    benefits: [
      'Réduction des pertes liées à la stratification thermique dans les grands volumes',
      'Scénarios PAC adaptés à l’existant et à l’usage réel du bâtiment',
      'Montage CEE structuré lorsque l’opération est éligible',
      'Interlocuteur unique pour la qualification et le suivi projet',
      'Vision claire des étapes avant travaux'
    ],
    problems: [
      'Chauffage sollicité pour compenser des écarts de température en hauteur',
      'Factures énergétiques élevées sans visibilité sur les leviers prioritaires',
      'Projets techniques dispersés (équipements, planning, exploitation)',
      'Dossiers de financement mal cadrés'
    ],
    solutions: [
      'Déstratification pour homogénéiser la température dans les halls et entrepôts',
      'Étude PAC industrielle / tertiaire selon contexte',
      'Structuration des informations pour le parcours CEE',
      'Accompagnement Effinor du web au suivi CRM'
    ]
  },
  'luminaires-tertiaire-bureaux': {
    title: 'Tertiaire & bureaux — confort et pilotage énergétique',
    parentPath: '/produits-solutions',
    parentLabel: 'Produits & Solutions',
    heroTitle: 'Pompe à chaleur et déstratification pour bureaux et espaces tertiaires',
    benefits: [
      'Meilleure maîtrise du chauffage et de la climatisation sur actifs multi-zones',
      'Confort thermique plus homogène dans les grands volumes',
      'Discours RSE et reporting plus lisibles pour la direction',
      'Dossier CEE préparé dès la phase qualification',
      'Réduction des charges d’exploitation ciblée'
    ],
    problems: [
      'Inconfort selon les zones (open space, halls, étages)',
      'Coûts d’exploitation difficiles à expliquer en interne',
      'Stratification thermique dans les espaces à grande hauteur libre',
      'Manque de lien clair entre investissement et financement CEE'
    ],
    solutions: [
      'PAC tertiaire dimensionnée avec contraintes d’occupation',
      'Déstratification sur les volumes concernés',
      'Cadrage projet pour les opérations standardisées',
      'Suivi des leads et des étapes côté Effinor'
    ]
  },
  'luminaires-commerces-gms': {
    title: 'Commerces & GMS — accueil et performance énergétique',
    parentPath: '/produits-solutions',
    parentLabel: 'Produits & Solutions',
    heroTitle: 'Chauffage, confort client et déstratification pour la grande distribution',
    benefits: [
      'Approche « bâtiment » : chauffage, volumes et plages d’ouverture',
      'Priorisation des leviers à fort impact sur la facture',
      'Projets défendables auprès des directions retail et facility',
      'Pistes CEE lorsque l’équipement et l’opération sont alignés',
      'Moins de dispersion sur des équipements hors périmètre'
    ],
    problems: [
      'Confort client et personnel inégal selon les zones',
      'Surconsommation de chauffage sur grandes surfaces et halls',
      'Contraintes d’image, d’hygiène et de planning serré',
      'Budget énergie sous pression'
    ],
    solutions: [
      'PAC et régulation adaptées aux usages retail',
      'Déstratification sur halls et zones à forte hauteur',
      'Qualification structurée pour le montage CEE',
      'Échanges coordonnés avec vos équipes exploitation'
    ]
  },
  'luminaires-parkings-exterieurs': {
    title: 'Parkings & abords — performance globale du site',
    parentPath: '/produits-solutions',
    parentLabel: 'Produits & Solutions',
    heroTitle: 'Réduire la consommation globale du bâtiment (parkings, locaux techniques, voirie)',
    benefits: [
      'Vision globale : ce qui compte pour la facture et le confort (hors seul luminaire)',
      'Identification des leviers CEE pertinents sur le patrimoine',
      'Accompagnement pour structurer un projet multi-zones',
      'Moins de silos entre « extérieur » et cœur de bâtiment',
      'Étude gratuite pour cadrer la suite'
    ],
    problems: [
      'Consommations éparpillées (technique, halls, parkings)',
      'Difficulté à prioriser les investissements',
      'Exigence de sécurité et de disponibilité',
      'Manque de lien entre site et dossier CEE'
    ],
    solutions: [
      'Qualification Effinor et orientation PAC / déstrat / autres leviers',
      'Structuration des données pour un dossier cohérent',
      'Liens vers les pages pompe à chaleur et déstratification',
      'Contact direct pour les cas atypiques'
    ]
  },
  'accessoires-pilotage': {
    title: 'Accompagnement & structuration de dossier',
    parentPath: '/produits-solutions',
    parentLabel: 'Produits & Solutions',
    heroTitle: 'Suivi de projet, traçabilité et préparation financement CEE',
    benefits: [
      'Collecte d’informations structurée dès le formulaire web',
      'Suivi CRM pour ne pas perdre le fil entre marketing et terrain',
      'Lecture claire des étapes (qualification, étude, validation)',
      'Alignement recherché entre l’opération et les fiches CEE',
      'Moins de friction pour vos équipes internes'
    ],
    problems: [
      'Données éparpillées entre interlocuteurs',
      'Dossiers montés tardivement ou incomplets',
      'Manque de visibilité sur l’éligibilité réelle',
      'Temps perdu sur des allers-retours inutiles'
    ],
    solutions: [
      'Tunnel mini-formulaire puis formulaire complet',
      'Documentation progressive du besoin et du bâtiment',
      'Points de contrôle avant engagement sur le financement',
      'Équipe Effinor dédiée aux projets CEE'
    ]
  },
  // Secteurs d'activité
  'industrie-logistique': {
    title: 'Industrie & logistique',
    parentPath: '/secteurs-activite',
    parentLabel: 'Secteurs d\'activité',
    heroTitle: 'Efficacité énergétique pour l\'industrie et la logistique',
    description: 'Réduisez la facture de chauffage et homogénéisez les volumes : pompe à chaleur, déstratification d’air et accompagnement CEE sur vos entrepôts, halls industriels et plateformes logistiques.',
    benefits: [
      'Déstratification pour limiter la stratification thermique sous plafond',
      'Projets pompe à chaleur adaptés au contexte industriel ou tertiaire léger',
      'Montage CEE structuré lorsque l’opération est dans le périmètre',
      'Qualification et suivi via les parcours Effinor (web + CRM)',
      'ROI ciblé sur le chauffage et le confort au sol',
      'Conformité aux exigences d’exploitation et de sécurité',
      'Interlocuteur unique pour cadrer le besoin',
      'Vision claire des étapes avant investissement lourd'
    ],
    problems: [
      'Coûts de chauffage élevés sur grands volumes et halls',
      'Chaleur piégée en hauteur, inconfort au sol et près des quais',
      'Projets techniques sans lien clair avec les financements CEE',
      'Contraintes d’activité (horaires, flux, stockage)',
      'Difficulté à prioriser les investissements',
      'Données dispersées entre maintenance, exploitation et direction',
      'Manque de temps pour monter des dossiers complets',
      'Objectifs RSE et énergie à reconcilier avec le budget'
    ],
    solutions: [
      'Déstratificateurs dimensionnés selon hauteur et usage',
      'Études PAC pour le chauffage et, selon site, l’ECS',
      'Structuration des informations pour les opérations standardisées CEE',
      'Appui sur les pages ressources et le blog pour la pédagogie',
      'Formulaires courts puis approfondissement pour ne rien perdre',
      'Accompagnement pour la traçabilité attendue sur le dossier',
      'Phasage possible selon vos fenêtres d’intervention',
      'Lien direct avec l’équipe Effinor après qualification'
    ],
    useCases: [
      'Entrepôts logistiques et centres de distribution',
      'Halls industriels et ateliers de production',
      'Plateformes logistiques et zones de chargement',
      'Usines de production et chaînes de montage',
      'Zones de stockage et réserves',
      'Hangars et bâtiments industriels',
      'Parkings et zones de livraison',
      'Espaces de bureaux intégrés'
    ],
    stats: [
      { label: 'Économies globales', value: 'jusqu\'à 80%' },
      { label: 'ROI moyen', value: '< 2 ans' },
      { label: 'Réduction chauffage', value: 'jusqu\'à 30%' },
      { label: 'Solutions disponibles', value: '5+ familles' }
    ]
  },
  'tertiaire-bureaux': {
    title: 'Tertiaire / bureaux',
    parentPath: '/secteurs-activite',
    parentLabel: 'Secteurs d\'activité',
    heroTitle: 'Bureaux et espaces tertiaires : chauffage, confort et CEE',
    description: 'Réduisez les charges de chauffage et de climatisation, améliorez le confort dans les grandes hauteurs avec la déstratification, et structurez votre projet pour les certificats d’économies d’énergie lorsque vous êtes éligibles.',
    benefits: [
      'Pompe à chaleur tertiaire pour chauffage et besoins réversibles (selon projet)',
      'Déstratification sur open spaces et halls à forte hauteur libre',
      'Meilleure lisibilité pour la direction (RSE, coûts, image)',
      'Qualification web alignée avec le suivi CRM Effinor',
      'Confort des occupants au centre du discours',
      'Économies d’énergie ciblées sur le chauffage et la climatisation',
      'Accompagnement sur le montage CEE',
      'Échanges adaptés aux équipes facility et immobilier'
    ],
    problems: [
      'Charges d’exploitation élevées sur le chauffage et la climatisation',
      'Inconfort thermique selon les zones et les étages',
      'Stratification thermique dans les volumes ouverts',
      'Projets techniques sans lien clair avec le financement CEE',
      'Contraintes d’occupation et de maintenance',
      'Reporting RSE et énergie à alimenter avec des faits',
      'Peu de bande passante pour des dossiers improvisés',
      'Décisions multi-acteurs (DSI, immobilier, direction)'
    ],
    solutions: [
      'Étude PAC et scénarios réalistes (neuf / rénovation / extension)',
      'Déstratificateurs pour homogénéiser la température utile',
      'Cadrage CEE : opération, équipement, preuves',
      'Formulaires Effinor pour structurer la donnée dès le départ',
      'Relais possible vers la page Contact pour les cas sensibles',
      'Documentation progressive du besoin',
      'Vision étape par étape pour rassurer les équipes',
      'Mise en cohérence avec vos plannings de travaux'
    ],
    useCases: [
      'Bureaux et open spaces',
      'Salles de réunion et espaces collaboratifs',
      'Couloirs et espaces de circulation',
      'Espaces d\'accueil et halls',
      'Cafétérias et espaces de détente',
      'Parkings souterrains et garages',
      'Salles serveurs et data centers',
      'Espaces de coworking'
    ],
    stats: [
      { label: 'Amélioration productivité', value: '+15%' },
      { label: 'Économies globales', value: 'jusqu\'à 60%' },
      { label: 'Qualité d\'air', value: 'Optimale' },
      { label: 'Solutions disponibles', value: '5+ familles' }
    ]
  },
  'retail-grande-distribution': {
    title: 'Retail & grande distribution',
    parentPath: '/secteurs-activite',
    parentLabel: 'Secteurs d\'activité',
    heroTitle: 'Magasins et grandes surfaces : confort client et maîtrise énergétique',
    description: 'Priorité au chauffage, aux volumes d’accueil et aux projets CEE cohérents : réduction des coûts, meilleur confort en hall et sur linéaires, discours simple pour les directions retail.',
    benefits: [
      'PAC et régulation adaptées aux plages d’ouverture et aux saisons',
      'Déstratification sur halls et zones à grande hauteur',
      'Structuration des informations pour un dossier CEE défendable',
      'Qualification via les formulaires Effinor',
      'Moins de dispersion sur des équipements hors scope métier',
      'Alignement recherché entre exploitation et investissement',
      'Accompagnement pour la traçabilité projet',
      'Liens vers les pages pompe à chaleur et déstratification'
    ],
    problems: [
      'Facture énergie sous tension (chauffage, climatisation)',
      'Inconfort ressenti par clients et équipes selon les zones',
      'Grands volumes et ouvertures fréquentes : pertes thermiques',
      'Décisions centralisées avec peu de marge pour l’essai / erreur',
      'Projets CEE à préparer avec un bon niveau de détail',
      'Image marque et exigence RSE',
      'Maintenance et exploitation déjà saturées',
      'Multi-sites : besoin de cadre commun'
    ],
    solutions: [
      'Scénarios PAC / climatisation intégrés au contexte retail',
      'Déstratificateurs pour homogénéiser la température utile',
      'Montage CEE : opération, périmètre, calendrier',
      'Tunnel web pour cadrer le besoin avant engagement',
      'Échanges avec les équipes pour les contraintes d’enseigne',
      'Documentation progressive pour alimenter le dossier',
      'Vision claire des étapes avant travaux',
      'Contact direct pour les cas multi-sites complexes'
    ],
    useCases: [
      'Magasins et boutiques',
      'Supermarchés et hypermarchés',
      'Centres commerciaux',
      'Showrooms et espaces d\'exposition',
      'Vitrines et présentoirs',
      'Rayons spécialisés'
    ],
    stats: [
      { label: 'Amélioration ventes', value: '+20%' },
      { label: 'Économies globales', value: 'jusqu\'à 70%' },
      { label: 'Confort clients', value: 'Optimisé' },
      { label: 'Solutions disponibles', value: '5+ familles' }
    ]
  },
  'collectivites-ecoles-gymnases': {
    title: 'Collectivités / écoles / gymnases',
    parentPath: '/secteurs-activite',
    parentLabel: 'Secteurs d\'activité',
    heroTitle: 'Collectivités et établissements scolaires : chauffage, grands volumes et CEE',
    description: 'Réduisez les dépenses énergétiques et améliorez le confort dans les gymnases et bâtiments publics : déstratification, projets de chauffage performants (dont PAC selon contexte) et accompagnement pour les dispositifs CEE lorsque les opérations sont éligibles.',
    benefits: [
      'Déstratification pour les grands volumes (gymnases, halls)',
      'Pompe à chaleur et solutions de chauffage adaptées aux bâtiments publics',
      'Discours budgétaire clair pour les élus et les services techniques',
      'Structuration de dossier pour les financements CEE',
      'Projets phasables sur vacances ou périodes creuses',
      'Durabilité et usage intensif pris en compte',
      'Accompagnement Effinor sur la qualification et le suivi',
      'Moins de dispersion sur des gammes hors besoin principal'
    ],
    problems: [
      'Budget contraint et forte visibilité politique',
      'Chauffage coûteux dans les gymnases et espaces à hauteur',
      'Confort thermique inégal pour élèves et publics',
      'Exigence de conformité et de sécurité',
      'Projets techniques à expliquer en comité',
      'Peu de marge pour les dossiers incomplets',
      'Multi-sites : besoin de méthode',
      'Objectifs climat et RSE des collectivités'
    ],
    solutions: [
      'Déstratificateurs pour homogénéiser la température dans les gymnases',
      'Études PAC et chauffage selon l’existant et la réglementation',
      'Montage CEE structuré lorsque l’opération correspond aux fiches',
      'Formulaires Effinor pour collecter les informations utiles',
      'Planification avec les services techniques',
      'Liens vers ressources et blog pour la pédagogie',
      'Relais Contact pour les dossiers sensibles',
      'Vision étape par étape pour les décideurs'
    ],
    useCases: [
      'Écoles primaires et secondaires',
      'Gymnases et salles de sport',
      'Cantines et restaurants scolaires',
      'Bibliothèques et CDI',
      'Couloirs et espaces communs',
      'Parkings et abords extérieurs'
    ],
    stats: [
      { label: 'Économies budgétaires', value: 'jusqu\'à 60%' },
      { label: 'Réduction chauffage', value: 'jusqu\'à 30%' },
      { label: 'Garantie', value: '5 ans' },
      { label: 'Solutions disponibles', value: '5+ familles' }
    ]
  },
  'sante-etablissements-sensibles': {
    title: 'Santé / établissements sensibles',
    parentPath: '/secteurs-activite',
    parentLabel: 'Secteurs d\'activité',
    heroTitle: 'Établissements de santé : chauffage, confort et performance énergétique',
    description: 'Réduisez la pression sur le budget énergie tout en respectant les contraintes sanitaires : projets de chauffage et de climatisation (dont PAC selon contexte), déstratification sur les grands volumes, et accompagnement CEE lorsque l’opération est dans le cadre.',
    benefits: [
      'Approche « bâtiment » : chauffage, volumes, contraintes d’occupation',
      'Déstratification possible sur halls et espaces à hauteur',
      'Structuration des données pour un dossier CEE sérieux',
      'Fiabilité et continuité de service au cœur du discours',
      'Économies ciblées sur le chauffage et la climatisation',
      'Accompagnement Effinor pour la qualification et le suivi',
      'Moins de dispersion sur des équipements hors périmètre',
      'Phasage possible selon vos contraintes d’exploitation'
    ],
    problems: [
      'Consommation élevée sur le chauffage, la climatisation et la ventilation',
      'Normes strictes (hygiène, sécurité, qualité d’air)',
      'Confort patients et personnel à concilier avec le budget',
      'Peu de tolérance aux arrêts ou aux mauvaises surprises',
      'Dossiers CEE à monter avec rigueur et traçabilité',
      'Organisation interne complexe (maintenance, achats, direction)',
      'Image et exigence RSE',
      'Temps limité pour les projets « parallèles »'
    ],
    solutions: [
      'Études PAC et chauffage selon l’existant et les contraintes du site',
      'Déstratificateurs pour homogénéiser la température dans les volumes concernés',
      'Cadrage CEE : opération, équipement, preuves attendues',
      'Collecte structurée via les formulaires Effinor',
      'Coordination avec vos équipes techniques',
      'Documentation progressive pour alimenter le dossier',
      'Contact direct pour les cas à forte sensibilité',
      'Vision claire des étapes avant travaux'
    ],
    useCases: [
      'Hôpitaux et CHU',
      'Cliniques et centres médicaux',
      'Blocs opératoires et salles stériles',
      'Services de soins et chambres',
      'Laboratoires et pharmacies',
      'Services d\'urgence et réanimation'
    ],
    stats: [
      { label: 'Conformité normes', value: '100%' },
      { label: 'Fiabilité', value: '99.9%' },
      { label: 'Économies globales', value: 'jusqu\'à 50%' },
      { label: 'Solutions disponibles', value: '5+ familles' }
    ]
  }
};

const CategoryDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const isProduitsSolutions = location.pathname.startsWith('/produits-solutions/');
  const isSecteursActivite = location.pathname.startsWith('/secteurs-activite/');
  
  const data = categoryData[slug];
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
   const [categoryAccessories, setCategoryAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [accessoriesError, setAccessoriesError] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isProduitsSolutions || isSecteursActivite) {
      fetchCategoryAndProducts();
    }
  }, [slug, isProduitsSolutions, isSecteursActivite]);

  const fetchCategoryAndProducts = async () => {
    try {
      setLoadingCategory(true);
      setLoadingProducts(true);
      setLoadingAccessories(true);
      setAccessoriesError(null);
      
      // Récupérer la catégorie par slug
      const { data: categoryDbData, error: categoryError } = await supabase
        .from('categories')
        .select('id, nom, slug, description, description_longue, images')
        .eq('slug', slug)
        .eq('actif', true)
        .single();

      if (categoryError) {
        if (categoryError.code === '42P01' || categoryError.message?.includes('does not exist')) {
          logger.warn('[CategoryDetail] Table categories does not exist yet');
        } else if (categoryError.code === 'PGRST116') {
          // Catégorie non trouvée dans la base, on continue quand même
          logger.warn('[CategoryDetail] Category not found in DB:', slug);
        } else {
          logger.error('[CategoryDetail] Error fetching category:', categoryError);
        }
      } else {
        setCategory(categoryDbData);
      }

      setLoadingCategory(false);

      // Pour les secteurs, récupérer les produits via product_sectors
      // Pour les catégories produits, récupérer via categorie_id
      if (isSecteursActivite) {
        // Récupérer les produits liés au secteur
        const sectorProductsResult = await getProductsBySector(slug);
        if (sectorProductsResult.success) {
          setProducts(sectorProductsResult.data || []);
        } else {
          logger.error('[CategoryDetail] Error fetching sector products:', sectorProductsResult.error);
          setProducts([]);
        }
      } else {
        // Récupérer les produits de cette catégorie (uniquement ceux avec image)
        let productsQuery = supabase
          .from('products')
          .select('id, nom, description, prix, image_1, image_2, image_3, image_4, image_url, slug, actif, categorie, categorie_id, marque, reference, caracteristiques, puissance')
          .eq('actif', true)
          .or('image_1.not.is.null,image_url.not.is.null');

        // Filtrer par categorie_id si disponible, sinon par categorie (slug)
        if (categoryDbData?.id) {
          productsQuery = productsQuery.eq('categorie_id', categoryDbData.id);
        } else {
          productsQuery = productsQuery.eq('categorie', slug);
        }

        const { data: productsData, error: productsError } = await productsQuery
          .order('ordre', { ascending: true });

        if (productsError) {
          if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
            logger.warn('[CategoryDetail] Table products does not exist yet');
          } else {
            logger.error('[CategoryDetail] Error fetching products:', productsError);
          }
          setProducts([]);
        } else {
          setProducts(productsData || []);
        }
      }

      // Charger les accessoires liés à cette catégorie (via les produits)
      try {
        const accessoriesResult = await getAccessoriesForCategory(slug);

        if (!accessoriesResult.success) {
          setAccessoriesError(accessoriesResult.error || 'Erreur lors du chargement des accessoires de la catégorie.');
          setCategoryAccessories([]);
        } else {
          setCategoryAccessories(accessoriesResult.data || []);
        }
      } catch (accessoriesErr) {
        logger.error('[CategoryDetail] Error fetching category accessories:', accessoriesErr);
        setAccessoriesError(accessoriesErr.message || 'Erreur lors du chargement des accessoires de la catégorie.');
        setCategoryAccessories([]);
      }
    } catch (err) {
      logger.error('[CategoryDetail] Error fetching category/products:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
      setLoadingCategory(false);
      setLoadingAccessories(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl && imagePath) {
      return `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imagePath}`;
    }
    return null;
  };

  const handleLeadRequest = () => {
    navigate('/contact');
  };

  // Déterminer le parentPath et parentLabel
  const parentPath = isProduitsSolutions ? '/produits-solutions' : isSecteursActivite ? '/secteurs-activite' : '/';
  const parentLabel = isProduitsSolutions ? 'Produits & Solutions' : isSecteursActivite ? 'Secteurs d\'activité' : 'Accueil';
  
  // Utiliser les données de la catégorie depuis la base ou les données hardcodées
  const categoryTitle = category?.nom || data?.title || slug;
  const categoryHeroTitle = category?.description || data?.heroTitle || `Catégorie ${categoryTitle}`;
  
  // Afficher la page si on a des données hardcodées, une catégorie en base, ou si on est en train de charger
  // On affiche toujours la page pour les routes /produits-solutions et /secteurs-activite
  if (!isProduitsSolutions && !isSecteursActivite && !data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page non trouvée</h1>
        <Link to="/" className="text-[var(--secondary-500)] hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const seo = usePageSEO(`${parentPath}/${slug}`);

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1 || categoryHeroTitle}
        intro={seo.intro}
      />

      <div className="min-h-screen bg-white overflow-x-hidden">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl overflow-x-hidden">
          <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <Breadcrumbs
              items={[
                { label: parentLabel, to: parentPath },
                { label: categoryTitle }
              ]}
            />

            <div className="mb-4 md:mb-6">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {seo.h1 || categoryHeroTitle}
              </h1>
              {seo.intro && (
                <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-relaxed">
                  {seo.intro}
                </p>
              )}
              {!seo.intro && category?.description && (
                <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            {/* Section Produits - Pour catégories produits ET secteurs */}
            {(isProduitsSolutions || isSecteursActivite) && (
              <section className="mb-6 md:mb-8">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                  {isSecteursActivite ? 'Produits recommandés pour ce secteur' : `Produits ${categoryTitle}`}
                </h2>
                {loadingProducts ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--secondary-500)]" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">
                      Aucun produit disponible dans cette catégorie pour le moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    {products.map((product) => {
                      const imageUrl = getImageUrl(product.image_1 || product.image_url);
                      return (
                        <div
                          key={product.id}
                          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[var(--secondary-500)]/30"
                        >
                          <div className="relative">
                            <div
                              className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (imageUrl) {
                                  const allImages = [
                                    product.image_1 || product.image_url,
                                    product.image_2,
                                    product.image_3,
                                    product.image_4
                                  ]
                                    .filter(Boolean)
                                    .map((img) => getImageUrl(img));
                                  if (allImages.length > 0) {
                                    setGalleryImages(allImages);
                                    setGalleryIndex(0);
                                    setGalleryOpen(true);
                                  }
                                }
                              }}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.nom}
                                  className="w-full h-full object-contain p-3 md:p-4 lg:p-2 max-w-[80%] max-h-[80%] mx-auto group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.src = 'https://placehold.co/400x400/e2e8f0/e2e8f0?text=Image';
                                  }}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">Pas d&apos;image</div>
                              )}
                            </div>
                          </div>
                          <Link to="/contact">
                            <div className="p-2 md:p-3">
                              {product.marque && (
                                <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1 uppercase tracking-wide">
                                  {product.marque}
                                </p>
                              )}
                              <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0.5 md:mb-1 group-hover:text-[var(--secondary-500)] transition-colors line-clamp-2">
                                {product.nom}
                              </h3>
                              {product.reference && (
                                <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-1.5">
                                  Réf: {product.reference}
                                </p>
                              )}
                              {product.description && (
                                <p className="text-gray-600 mb-1.5 md:mb-2 line-clamp-2 text-[10px] md:text-xs leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                              {product.puissance && (
                                <p className="text-[10px] md:text-xs text-gray-700 mb-1 md:mb-1.5">
                                  <strong>Puissance:</strong> {product.puissance}W
                                </p>
                              )}
                              {product.prix && !product.sur_devis ? (
                                <div className="mb-1.5 md:mb-2">
                                  <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--secondary-500)]">
                                    {typeof product.prix === 'number'
                                      ? `${product.prix.toFixed(2)} € HT`
                                      : product.prix}
                                  </p>
                                  <p className="text-[10px] md:text-xs text-gray-500">
                                    soit {typeof product.prix === 'number'
                                      ? `${(product.prix * 1.20).toFixed(2)} € TTC`
                                      : ''}
                                  </p>
                                </div>
                              ) : product.sur_devis ? (
                                <p className="text-sm md:text-base text-gray-600 mb-1.5 md:mb-2">Sur devis</p>
                              ) : null}
                            </div>
                          </Link>
                          <div className="px-2 md:px-3 pb-2 md:pb-3 flex flex-col sm:flex-row gap-1.5 md:gap-2">
                            <Link to="/contact" className="flex-1">
                              <Button variant="outline" className="w-full text-[10px] md:text-xs py-1.5 md:py-2 h-auto">
                                Éligibilité CEE
                                <ArrowRight className="ml-1 h-2.5 w-2.5 md:h-3 md:w-3" />
                              </Button>
                            </Link>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleLeadRequest();
                              }}
                              className="bg-[var(--secondary-500)] hover:bg-[var(--secondary-600)] text-[10px] md:text-xs py-1.5 md:py-2 h-auto px-2 md:px-3 w-full sm:w-auto"
                            >
                              <ClipboardList className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Accessoires compatibles pour cette catégorie */}
            {isProduitsSolutions && (
              <section className="mb-6 md:mb-8">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                  Accessoires compatibles pour cette catégorie
                </h2>
                {loadingAccessories ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--secondary-500)]" />
                  </div>
                ) : accessoriesError ? (
                  <p className="text-xs md:text-sm text-red-500">
                    {accessoriesError}
                  </p>
                ) : categoryAccessories.length === 0 ? (
                  <p className="text-xs md:text-sm text-gray-500">
                    Aucun accessoire n&apos;est encore défini pour cette catégorie.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    {categoryAccessories.map((accessory) => {
                      const imageUrl = getImageUrl(accessory.image_1 || accessory.image_url);
                      return (
                        <div
                          key={accessory.id}
                          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[var(--secondary-500)]/30"
                        >
                          <Link to="/contact">
                            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={accessory.nom}
                                  className="w-full h-full object-contain p-3 md:p-4 lg:p-2 max-w-[80%] max-h-[80%] mx-auto group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.src = 'https://placehold.co/400x400/e2e8f0/e2e8f0?text=Image';
                                  }}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">Pas d&apos;image</div>
                              )}
                            </div>
                          </Link>
                          <div className="p-2 md:p-3">
                            <Link to="/contact">
                              <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0.5 md:mb-1 group-hover:text-[var(--secondary-500)] transition-colors line-clamp-2">
                                {accessory.nom}
                              </h3>
                            </Link>
                            {accessory.description && (
                              <p className="text-gray-600 mb-1.5 md:mb-2 line-clamp-2 text-[10px] md:text-xs leading-relaxed">
                                {accessory.description}
                              </p>
                            )}
                            {accessory.prix && !accessory.sur_devis && (
                              <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--secondary-500)] mb-1.5 md:mb-2">
                                {typeof accessory.prix === 'number'
                                  ? `${accessory.prix.toFixed(2)} €`
                                  : accessory.prix}
                              </p>
                            )}
                            {accessory.sur_devis && (
                              <p className="text-[10px] md:text-xs text-gray-500 mb-1.5">
                                Prix sur devis
                              </p>
                            )}
                          </div>
                          <div className="px-2 md:px-3 pb-2 md:pb-3 flex">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleLeadRequest();
                              }}
                              className="bg-[var(--secondary-500)] hover:bg-[var(--secondary-600)] text-[10px] md:text-xs py-1.5 md:py-2 h-auto px-2 md:px-3 w-full"
                            >
                              <ClipboardList className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                              Demander une étude
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Galerie d'images de la catégorie */}
            {category?.images && Array.isArray(category.images) && category.images.length > 0 && (
              <section className="mb-6 md:mb-8">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                  Découvrez nos solutions {categoryTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                {category.images.map((image, idx) => {
                  const imageUrl = getImageUrl(image.url);
                  return (
                  <div 
                    key={idx} 
                    className="group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      const allImages = category.images.map(img => ({
                        url: getImageUrl(img.url),
                        alt_text: img.alt_text,
                        legend: img.legend
                      }));
                      setGalleryImages(allImages);
                      setGalleryIndex(idx);
                      setGalleryOpen(true);
                    }}
                  >
                    {imageUrl ? (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={image.alt_text || image.legend || `Image ${categoryTitle} ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/800x600/e2e8f0/e2e8f0?text=Image';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400 text-xs">Pas d'image</div>
                      </div>
                    )}
                    {image.legend && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium">{image.legend}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

            {/* Description longue de la catégorie */}
            {category?.description_longue && (
              <section className="mb-8">
                <div className="bg-gradient-to-br from-[var(--secondary-500)]/5 to-[var(--secondary-500)]/10 rounded-lg p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                    Pourquoi choisir {categoryTitle} ?
                  </h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed text-xs md:text-sm whitespace-pre-line">
                      {category.description_longue}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Sections bénéfices, problèmes, solutions - seulement si données hardcodées disponibles */}
            {data && (
              <>
                <section className="mb-6 md:mb-8">
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Bénéfices clés</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {data.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-gray-50 rounded-lg p-3">
                        <CheckCircle2 className="h-4 w-4 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 text-xs md:text-sm leading-relaxed">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-red-50 rounded-lg p-3 md:p-4">
                    <h2 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-2 md:mb-3">Problèmes fréquents</h2>
                    <ul className="space-y-2">
                      {data.problems.map((problem, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-0.5 font-bold text-sm">•</span>
                          <p className="text-gray-700 text-xs md:text-sm leading-relaxed">{problem}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[var(--secondary-500)]/5 rounded-lg p-3 md:p-4">
                    <h2 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-2 md:mb-3">Notre réponse</h2>
                    <ul className="space-y-2">
                      {data.solutions.map((solution, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700 text-xs md:text-sm leading-relaxed">{solution}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}

            <section className="bg-[var(--secondary-500)] text-white rounded-lg p-3 md:p-4 lg:p-6 text-center">
              <h2 className="text-sm md:text-base lg:text-lg font-bold mb-1.5 md:mb-2">Prêt à structurer votre projet PAC ou déstratification ?</h2>
              <p className="text-[10px] md:text-xs lg:text-sm mb-3 md:mb-4 opacity-90">
                Demandez un devis gratuit et personnalisé pour votre projet.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-white text-[var(--secondary-500)] rounded-lg hover:bg-gray-100 transition-all font-semibold text-[10px] md:text-xs lg:text-sm shadow-sm hover:shadow-md"
              >
                Demander un devis
                <ArrowRight className="ml-1.5 md:ml-2 h-2.5 w-2.5 md:h-3 md:w-3" />
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGallery
        images={galleryImages}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </>
  );
};

export default CategoryDetail;

