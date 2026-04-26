/**
 * Configuration statique du site Effinor (branding, SEO, contenu par défaut).
 * Les champs de contact / stats en production peuvent être surchargés via Supabase
 * (`getSiteContact`, `getSiteStats` dans `site-settings.ts`).
 * Les pages légales s’appuient sur ce fichier pour ne pas dépendre de la base.
 */

export const siteConfig = {
  name: 'Effinor',
  url: 'https://effinor.fr',
  tagline: 'Rénovation énergétique et CEE',
  description:
    "Effinor accompagne particuliers et professionnels dans leurs projets de rénovation énergétique : pompes à chaleur, système solaire combiné, rénovation globale.",
  contact: {
    email: 'contact@effinor.fr',
    phone: '09 78 45 50 63',
    phoneE164: '+33978455063',
    address: {
      street: "Tour Europa, Av. de l'Europe",
      postalCode: '94320',
      city: 'Thiais',
      country: 'France',
      full: "Tour Europa, Av. de l'Europe, 94320 Thiais",
    },
    hours: {
      label: 'Lun-Ven : 8h-18h',
      schema: [
        { days: 'Mo,Tu,We,Th,Fr', opens: '08:00', closes: '18:00' },
      ],
    },
  },
  legal: {
    companyName: 'Effinor',
    siret: '', // À compléter quand tu auras le SIRET officiel
  },
  social: {
    // Ajouter ici linkedin, facebook, instagram quand pertinent
  },
} as const

export type SiteConfig = typeof siteConfig
