import type { ReEnergieCategoryWithArticles } from '@/lib/re-energie'

/**
 * Affichage sans Supabase (build CI) ou en attendant la migration / contenu.
 */
export function getStaticReEnergieHubFallback(): ReEnergieCategoryWithArticles[] {
  return [
    {
      id: 'fallback-iso',
      slug: 'isolation',
      title: 'Isolation',
      sort_order: 10,
      icon_key: 'layout-grid',
      articles: [
        {
          id: 'fb-iso-1',
          slug: 'combles',
          title: 'Combles',
          excerpt: 'Isolez les combles pour réduire les déperditions (contenu géré côté ERP en production).',
          sort_order: 10,
          icon_key: 'home',
          external_href: '/contact',
        },
        {
          id: 'fb-iso-2',
          slug: 'murs',
          title: 'Murs',
          excerpt: "Isolation intérieure ou extérieure de l’enveloppe (contenu géré côté ERP en production).",
          sort_order: 20,
          icon_key: 'building-2',
          external_href: '/contact',
        },
        {
          id: 'fb-iso-3',
          slug: 'fenetres',
          title: 'Fenêtres',
          excerpt: "Remplacement des menuiseries pour le confort et la performance (contenu géré côté ERP en production).",
          sort_order: 30,
          icon_key: 'frame',
          external_href: '/contact',
        },
        {
          id: 'fb-iso-4',
          slug: 'sols',
          title: 'Sols',
          excerpt: "Isolation des planchers (vide sanitaire, sous-sol) — contenu géré côté ERP en production.",
          sort_order: 40,
          icon_key: 'layers',
          external_href: '/contact',
        },
      ],
    },
    {
      id: 'fallback-ch',
      slug: 'chauffage',
      title: 'Chauffage',
      sort_order: 20,
      icon_key: 'flame',
      articles: [
        {
          id: 'fb-ch-1',
          slug: 'pompe-a-chaleur',
          title: 'Pompe à chaleur',
          excerpt: "PAC air-eau ou air-air : voir notre fiche complète (page publique existante) pour aides et scénarios.",
          sort_order: 10,
          icon_key: 'air-vent',
          external_href: '/services/pompe-a-chaleur/maison-individuelle',
        },
        {
          id: 'fb-ch-2',
          slug: 'pompe-a-chaleur-immeuble',
          title: 'Pompe à chaleur — immeuble',
          excerpt: "Solutions en copropriété et collectif — fiche service détaillée sur le site.",
          sort_order: 20,
          icon_key: 'building-2',
          external_href: '/services/pompe-a-chaleur/immeuble-collectif',
        },
        {
          id: 'fb-ch-3',
          slug: 'systeme-solaire-combine',
          title: 'Système solaire combiné',
          excerpt: "SSC : chauffage et eau chaude solaire — consultez notre fiche service.",
          sort_order: 30,
          icon_key: 'sun',
          external_href: '/services/systeme-solaire-combine',
        },
      ],
    },
    {
      id: 'fallback-rg',
      slug: 'renovation-globale',
      title: 'Rénovation globale',
      sort_order: 30,
      icon_key: 'house-plus',
      articles: [
        {
          id: 'fb-rg-1',
          slug: 'renovation-globale',
          title: 'Rénovation globale',
          excerpt: "Bouquet de travaux et barèmes d’aides (BAR-TH-174) — fiche pédagogique sur le site.",
          sort_order: 10,
          icon_key: 'sparkles',
          external_href: '/services/renovation-globale',
        },
      ],
    },
  ]
}
