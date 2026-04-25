/**
 * Témoignages clients affichés sur la home.
 *
 * ⚠️ TODO Moufdi : remplacer par de vrais témoignages clients (avec leur accord RGPD).
 * Format inspiré d'Effy / Hellio : prénom + initiale + ville + note + texte court.
 */

export interface Testimonial {
  id: string
  authorName: string      // ex: "Sophie L."
  authorCity: string      // ex: "Lyon (69)"
  authorInitials: string  // ex: "SL"
  rating: number          // 1-5
  text: string
  service: string         // ex: "Pompe à chaleur"
  date: string            // ex: "Mars 2026"
}

export const homeTestimonials: Testimonial[] = [
  {
    id: 'placeholder-1',
    authorName: 'Sophie L.',
    authorCity: 'Lyon (69)',
    authorInitials: 'SL',
    rating: 5,
    text:
      "Accompagnement de bout en bout, équipe à l'écoute et chantier propre. Ma facture de chauffage a baissé de 60% dès le premier hiver. Je recommande Effinor sans hésiter.",
    service: 'Pompe à chaleur air-eau',
    date: 'Mars 2026',
  },
  {
    id: 'placeholder-2',
    authorName: 'Karim B.',
    authorCity: 'Toulouse (31)',
    authorInitials: 'KB',
    rating: 5,
    text:
      "J'avais peur de la complexité administrative des aides. Effinor a tout géré : MaPrimeRénov', CEE, dossier ANAH. Au final 14 000 € d'aides sur un projet de 18 000 €.",
    service: 'Rénovation globale',
    date: 'Janvier 2026',
  },
  {
    id: 'placeholder-3',
    authorName: 'Marie-Hélène P.',
    authorCity: 'Nantes (44)',
    authorInitials: 'MP',
    rating: 5,
    text:
      "Étude technique sérieuse, devis clair, installation impeccable en 3 jours. Le suivi par l'équipe technique a été parfait. Très bon rapport qualité-prix.",
    service: 'Système solaire combiné',
    date: 'Février 2026',
  },
] as const
