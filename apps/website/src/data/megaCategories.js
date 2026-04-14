/**
 * Configuration des grandes catégories (mega-categories)
 * Aligné refonte lead-gen : PAC + déstratification uniquement côté positionnement public.
 */

export const megaCategories = [
  {
    id: 'chauffer',
    label: 'Chauffer',
    slug: 'chauffer',
    icon: 'Flame',
    color: 'orange',
    description: 'Pompe à chaleur et solutions de chauffage',
    categorySlugs: [],
  },
  {
    id: 'refroidir',
    label: 'Refroidir',
    slug: 'refroidir',
    icon: 'Snowflake',
    color: 'blue',
    description: 'Climatisation et refroidissement',
    categorySlugs: [],
  },
  {
    id: 'ventilation',
    label: 'Ventilation',
    slug: 'ventilation',
    icon: 'Wind',
    color: 'teal',
    description: 'Déstratification et traitement de l’air',
    categorySlugs: ['destratificateur-industriel'],
  },
  {
    id: 'bornes-recharge',
    label: 'Bornes de recharge',
    slug: 'bornes-recharge',
    icon: 'Zap',
    color: 'purple',
    description: 'Recharge électrique',
    categorySlugs: [],
  },
];

export const getMegaCategoryForCategory = (categorySlug) => {
  return megaCategories.find((megaCat) => megaCat.categorySlugs.includes(categorySlug)) || null;
};

export const organizeCategoriesByMegaCategory = (categories) => {
  const organized = {};

  megaCategories.forEach((megaCat) => {
    organized[megaCat.id] = {
      ...megaCat,
      categories: [],
    };
  });

  categories.forEach((category) => {
    const megaCat = getMegaCategoryForCategory(category.slug);
    if (megaCat) {
      organized[megaCat.id].categories.push(category);
    }
  });

  return organized;
};
