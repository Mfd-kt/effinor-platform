/**
 * Registre central des images.
 *
 * - Images Effinor propres : chemins /images/* (public/)
 * - Images Unsplash CDN : U(id) pour les zones sans visuel réel
 *
 * Pour remplacer une image Unsplash par un visuel Effinor, modifier uniquement ce fichier.
 */

const U = (id, w = 1920, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

/**
 * Photos réelles de réalisations Effinor.
 * Servies depuis /public/images/ (incluses dans le build Vite).
 */
export const REAL_PHOTOS = {
  /**
   * Chaufferie pompe à chaleur — installation ATAG professionnelle.
   * Ballon tampon, vases d'expansion, distribution hydraulique.
   * @alt "Chaufferie pompe à chaleur installée par Effinor — ballon tampon et distribution hydraulique"
   */
  pacInstallationChaufferie: '/images/pac-installation-chaufferie.png',

  /**
   * Salle technique PAC — immeuble collectif / résidentiel.
   * 3 unités PAC au sol, réseau de distribution isolé en hauteur, filtre eau, ballon tampon.
   * @alt "Installation pompe à chaleur pour immeuble collectif — salle technique avec trois unités PAC"
   */
  pacImmeubleCollectif: '/images/pac-immeuble-collectif.png',

  /**
   * Technicien sur nacelle CMG installant un déstratificateur d'air au plafond d'un bâtiment industriel.
   * Photo terrain parfaite pour illustrer l'installation et la preuve concrète.
   * @alt "Technicien installant un déstratificateur d'air en hauteur — bâtiment industriel"
   */
  destratInstallationIndustriel: '/images/destrat-installation-industriel.png',

  /**
   * Déstratificateur mural installé dans un grand bâtiment tertiaire / entrepôt.
   * Vue intérieure avec gaines, charpente métallique et éclairage fluorescent.
   * @alt "Déstratificateur d'air installé dans un bâtiment tertiaire — vue intérieure haute"
   */
  destratInstallationTertiaire: '/images/destrat-installation-tertiaire.png',

  /**
   * Entrepôt logistique avec racks de stockage hauts et chariots élévateurs.
   * Vue intérieure grand volume — illustre parfaitement la problématique de stratification.
   * @alt "Entrepôt logistique avec chariots élévateurs — grands volumes à déstratifier"
   */
  entrepotLogistique: '/images/entrepot-logistique.png',

  /**
   * Atelier industriel de production avec machines, charpente métallique et toiture vitrée.
   * Vue en hauteur — montre clairement les volumes importants sujets à stratification.
   * @alt "Atelier de production industrielle — grand volume avec charpente métallique et machines"
   */
  atelierProductionIndustriel: '/images/atelier-production-industriel.png',

  /**
   * Bâtiment industriel mixte moderne — ponts roulants ABUS, machines SITEXCO, sol béton propre.
   * Idéal pour illustrer les bâtiments d'activité à grand volume.
   * @alt "Bâtiment industriel mixte avec ponts roulants et machines — grand volume"
   */
  batimentIndustrielMixte: '/images/batiment-industriel-mixte.png',

  /**
   * Schéma pédagogique : bâtiment SANS vs AVEC déstratificateur.
   * Gradient de température (27°C→18°C) et circulation de l'air chaud redistribué au sol.
   * @alt "Schéma déstratification : bâtiment sans et avec déstratificateur — redistribution de la chaleur"
   */
  destratSchemaStratification: '/images/destrat-schema-stratification.png',

  /**
   * Gymnase / salle omnisports avec charpente bois apparente et toiture vitrée.
   * Parquet, paniers de basket, badminton — grand volume typique de déstratification.
   * @alt "Gymnase omnisports avec charpente bois — grand volume idéal pour la déstratification"
   */
  gymnaseSalleSport: '/images/gymnase-salle-sport.png',

  /**
   * Centre commercial multi-niveaux avec galerie marchande, escalators et affluence.
   * Illustre les espaces retail et commerces à fort passage.
   * @alt "Centre commercial multi-niveaux — espace retail avec galerie marchande et affluence"
   */
  centreCommercialRetail: '/images/centre-commercial-retail.png',

  /**
   * Open space tertiaire moderne — illustration stylisée avec hauteur sous plafond, gaines apparentes et grandes baies vitrées.
   * @alt "Open space tertiaire moderne — bureaux avec hauteur sous plafond et grandes baies vitrées"
   */
  bureauxOpenSpace: '/images/bureaux-open-space.png',

  /**
   * Grande surface / établissement recevant du public — espace commercial à forte affluence, plafond industriel apparent.
   * @alt "Établissement recevant du public — grande surface commerciale avec plafond apparent et fort passage"
   */
  etablissementERP: '/images/etablissement-erp.png',

  /**
   * Résidence de copropriété moderne — immeubles collectifs avec balcons, façade blanche, espaces verts.
   * @alt "Résidence de copropriété moderne — immeubles collectifs avec balcons et espaces verts"
   */
  coproprieteImmeuble: '/images/copropriete-immeuble.png',

  /**
   * Rendu architectural — résidence collective moderne, tour d'habitation, espaces communs animés.
   * @alt "Résidence collective moderne — tour d'habitation avec espaces communs et jardins partagés"
   */
  immeubleCollectifResidence: '/images/immeuble-collectif-residence.png',

  /**
   * Résidence services moderne — façade bois et béton, "Twenty Campus", commerce en rez-de-chaussée.
   * @alt "Résidence services moderne — bâtiment tertiaire avec façade bois et rez-de-chaussée commercial"
   */
  residenceServices: '/images/residence-services.png',

  /**
   * Petit collectif moderne en rénovation — immeuble R+4 avec balcons bois, commerce en RDC (KP1 La Poste).
   * @alt "Petit immeuble collectif moderne — rénovation énergétique avec pompe à chaleur"
   */
  petitCollectifRenovation: '/images/petit-collectif-renovation.png',
};

export const IMAGES = {
  /**
   * Backgrounds de héros (utilisés avec overlay sombre).
   * Résolution élevée, chargées en CSS background-image.
   */
  hero: {
    /** Photo réelle Effinor : chaufferie PAC professionnelle */
    pac: REAL_PHOTOS.pacInstallationChaufferie,
    /** PAC tertiaire : immeuble de bureaux */
    pacTertiaire: U('1486325212027-8081e485255e'),
    /** Équilibrage hydraulique : chaufferie avec vannes et réseau de distribution */
    equilibrage: U('1558618666-fcd25c85cd64', 1920, 75),
    /** Photo réelle Effinor : installation déstratificateur au plafond industriel */
    destrat: REAL_PHOTOS.destratInstallationIndustriel,
    /** Photo réelle Effinor : installation déstratificateur industriel */
    destratIndustriel: REAL_PHOTOS.destratInstallationIndustriel,
    /** Photo réelle Effinor : déstratificateur mural — bâtiment tertiaire */
    destratTertiaire: REAL_PHOTOS.destratInstallationTertiaire,
    /** À propos : bâtiment moderne nuit */
    about: U('1487958449943-2429e8be8625'),
    /** Contact : open-space professionnel */
    contact: U('1497366216548-37526070297c'),
    /** Ressources : tablette / document numérique */
    ressources: U('1551288049-bebda4e38f71'),
  },

  /**
   * Images des cards "types de bâtiments".
   * Ratio 4:3, compressées pour les thumbnails.
   */
  buildings: {
    /** Open-space / bureaux tertiaires */
    office: U('1497366216548-37526070297c', 800, 75),
    /** Entrepôt logistique grande hauteur */
    warehouse: U('1464938050520-ef2270bb8ce8', 800, 75),
    /** Atelier / site de production */
    factory: U('1565793979563-f46093f434f1', 800, 75),
    /** Commerce / grande surface */
    commercial: U('1441986300917-64674bd600d8', 800, 75),
    /** Copropriété résidentielle */
    residential: U('1580587771525-4e2d8b5f9c83', 800, 75),
    /** Gymnase / salle de sport */
    gym: U('1544033527-b192dacd1574', 800, 75),
    /** ERP : école, clinique, établissement public */
    erp: U('1588345921523-c2dcdb7f1e66', 800, 75),
    /** Hall industriel mixte */
    industrial: U('1558618666-fcd25c85cd64', 800, 75),
  },

  /**
   * Section "À propos" : photos d'équipe et chantiers.
   */
  about: {
    team: U('1600880292203-757bb62b4baf', 1200, 80),
    /** Photo réelle : installation PAC — utilisée en section "projet terrain" */
    project: REAL_PHOTOS.pacInstallationChaufferie,
    building: U('1486406146926-c627a92ad1ab', 1200, 80),
  },

  /**
   * Photos inline pour les sections Solution / Réalisation.
   * Affichées sans overlay (ou avec overlay très léger).
   */
  inline: {
    /** Photo réelle : chaufferie PAC complète (tertiaire / bureaux) */
    pacChaufferie: REAL_PHOTOS.pacInstallationChaufferie,
    /** Photo réelle : salle technique PAC — immeuble collectif */
    pacCollectif: REAL_PHOTOS.pacImmeubleCollectif,
    /** Photo réelle : technicien sur nacelle installant un déstratificateur au plafond industriel */
    destratInstallation: REAL_PHOTOS.destratInstallationIndustriel,
    /** Photo réelle : déstratificateur mural dans un grand bâtiment tertiaire */
    destratTertiaire: REAL_PHOTOS.destratInstallationTertiaire,
    /** Photo réelle : entrepôt logistique avec racks hauts et chariots élévateurs */
    entrepotLogistique: REAL_PHOTOS.entrepotLogistique,
    /** Photo réelle : atelier de production industrielle — grand volume avec charpente et machines */
    atelierProductionIndustriel: REAL_PHOTOS.atelierProductionIndustriel,
    /** Photo réelle : bâtiment industriel mixte moderne — ponts roulants et machines */
    batimentIndustrielMixte: REAL_PHOTOS.batimentIndustrielMixte,
    /** Schéma pédagogique : stratification thermique sans/avec déstratificateur */
    destratSchema: REAL_PHOTOS.destratSchemaStratification,
    /** Photo réelle : gymnase omnisports avec charpente bois et toiture vitrée */
    gymnaseSalleSport: REAL_PHOTOS.gymnaseSalleSport,
    /** Photo réelle : centre commercial multi-niveaux — galerie marchande et affluence */
    centreCommercialRetail: REAL_PHOTOS.centreCommercialRetail,
    /** Illustration : open space tertiaire moderne avec hauteur sous plafond et gaines apparentes */
    bureauxOpenSpace: REAL_PHOTOS.bureauxOpenSpace,
    /** Photo : grande surface ERP — espace commercial à forte affluence, plafond industriel apparent */
    etablissementERP: REAL_PHOTOS.etablissementERP,
    /** Photo : résidence de copropriété moderne — immeubles collectifs avec balcons */
    coproprieteImmeuble: REAL_PHOTOS.coproprieteImmeuble,
    /** Rendu : résidence collective moderne — tour d'habitation et espaces communs */
    immeubleCollectifResidence: REAL_PHOTOS.immeubleCollectifResidence,
    /** Photo : résidence services moderne — façade bois/béton, rez-de-chaussée commercial */
    residenceServices: REAL_PHOTOS.residenceServices,
    /** Photo : petit collectif moderne R+4 — balcons bois, idéal rénovation PAC */
    petitCollectifRenovation: REAL_PHOTOS.petitCollectifRenovation,
  },

  /**
   * Ressources : mockup document/guide.
   */
  ressources: {
    guide: U('1541963463532-d928c7af8d3c', 900, 80),
  },
};
