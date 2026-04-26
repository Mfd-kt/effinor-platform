/**
 * Configuration statique de la landing Pompe à chaleur.
 * Contrairement à apps/website, pas de lecture dynamique Supabase :
 * la landing reste servable même si la base est indisponible.
 */

export const landingConfig = {
  name: 'Effinor',
  url: 'https://pompe-a-chaleur.effinor.fr',
  mainSiteUrl: 'https://effinor.fr',
  tagline: 'Pompe à chaleur air-eau — Maison individuelle',
  description:
    "Installez une pompe à chaleur air-eau dans votre maison individuelle. Économies jusqu'à 75% sur votre facture de chauffage. Aides CEE et MaPrimeRénov' jusqu'à 11 000 €.",
  contact: {
    email: 'contact@effinor.fr',
    phone: '09 78 45 50 63',
    phoneE164: '+33978455063',
    hours: 'Lun-Ven : 8h-18h',
  },
  legal: {
    companyName: 'Effinor',
  },
} as const

export type LandingConfig = typeof landingConfig

/**
 * Contrat minimal utilisé par le simulateur partagé (`SimulatorResult`).
 * On duplique ce type localement pour ne pas dépendre du site vitrine.
 */
export type SiteContact = {
  phone: string
  phoneE164: string
  email: string
}
