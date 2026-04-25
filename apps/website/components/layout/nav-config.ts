/**
 * Configuration de la navigation principale du site.
 * Définit les liens du Header et du Footer.
 */

export interface NavItem {
  label: string
  href: string
  description?: string
  children?: NavItem[]
}

export const mainNav: NavItem[] = [
  { label: 'Accueil', href: '/' },
  {
    label: 'Services',
    href: '/services',
    children: [
      {
        label: 'Pompe à chaleur — Maison individuelle',
        href: '/services/pompe-a-chaleur/maison-individuelle',
        description: 'PAC air-eau ou air-air pour maisons individuelles',
      },
      {
        label: 'Pompe à chaleur — Immeuble collectif',
        href: '/services/pompe-a-chaleur/immeuble-collectif',
        description: 'Solutions PAC pour bâtiments résidentiels collectifs',
      },
      {
        label: 'Système solaire combiné',
        href: '/services/systeme-solaire-combine',
        description: 'Chauffage et eau chaude solaire (SSC)',
      },
      {
        label: 'Rénovation globale',
        href: '/services/renovation-globale',
        description: 'Bouquet de travaux BAR-TH-174',
      },
    ],
  },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Blog', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export const legalNav: NavItem[] = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
]
