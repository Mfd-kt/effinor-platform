/**
 * Statistiques de confiance affichées sur le site (bandeau, footer).
 *
 * ⚠️ TODO Moufdi : remplacer ces placeholders par les vrais chiffres Effinor.
 * Source unique : modifier ici pour mettre à jour partout.
 */

export interface SiteStat {
  label: string
  value: string
  description?: string
}

export const siteStats: SiteStat[] = [
  {
    value: '2 500+',
    label: 'Chantiers réalisés',
    description: '[TODO Moufdi] Nombre réel de chantiers',
  },
  {
    value: '1 800 €',
    label: 'Économies moyennes/an',
    description: '[TODO Moufdi] Économies réelles par foyer',
  },
  {
    value: '4.7/5 ★',
    label: 'Note clients',
    description: "[TODO Moufdi] Plateforme d'avis et nombre",
  },
  {
    value: 'RGE',
    label: 'QualiPAC · QualiPV · Qualibois',
    description: '[TODO Moufdi] Confirmer certifications exactes',
  },
] as const
