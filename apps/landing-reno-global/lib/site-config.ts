/**
 * Configuration statique de la landing Rénovation globale.
 * Données de contact et branding ; pas de lecture dynamique Supabase
 * (landing servable même si la base est indisponible).
 */

export const landingConfig = {
  name: 'Effinor',
  url: 'https://renovation.effinor.fr',
  mainSiteUrl: 'https://effinor.fr',
  tagline: 'Rénovation globale — BAR-TH-174',
  description:
    "Rénovez votre maison de A à Z avec Effinor : jusqu'à 90 % du montant financé par les aides CEE et MaPrimeRénov'. Audit énergétique inclus, 2 sauts de classe DPE minimum, dossier géré de A à Z.",
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

/** Contrat minimal utilisé par le simulateur partagé. */
export type SiteContact = {
  phone: string
  phoneE164: string
  email: string
}
