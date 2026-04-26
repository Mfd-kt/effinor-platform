import type { TrancheValue } from './schema'

/**
 * Plafonds de revenus fiscaux de référence (€ / an) par taille de foyer.
 * Valeurs hors Île-de-France (barème le plus utilisé côté pré-qualification
 * site vitrine : la zone précise n'est pas encore connue à cette étape).
 * Mêmes données que `apps/erp/features/simulator-cee/domain/plafonds.ts`
 * (table `INCOME_HORS_IDF`). Les petites différences IDF seront re-calibrées
 * par le conseiller au moment du rappel.
 */
const INCOME_HORS_IDF: Record<
  number,
  { tres_modeste: number; modeste: number; intermediaire: number }
> = {
  1: { tres_modeste: 22_461, modeste: 27_443, intermediaire: 35_052 },
  2: { tres_modeste: 32_981, modeste: 40_372, intermediaire: 51_481 },
  3: { tres_modeste: 39_742, modeste: 48_662, intermediaire: 62_007 },
  4: { tres_modeste: 46_491, modeste: 56_916, intermediaire: 72_377 },
  5: { tres_modeste: 53_267, modeste: 65_196, intermediaire: 82_823 },
}

function clampPersons(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1
  if (n > 5) return 5
  return Math.floor(n)
}

function fmt(n: number): string {
  return `${n.toLocaleString('fr-FR')} €`
}

export type TrancheOption = {
  value: TrancheValue
  label: string
  description: string
}

/**
 * Construit les 5 options de tranche (4 tranches fiscales + « je préfère ne pas
 * répondre ») avec des bornes recalculées à partir du nombre de personnes du
 * foyer. Si `nbPersonnes` n'est pas encore connu, on passe `null` et on
 * affiche des bornes génériques pour 1 personne.
 */
export function buildTrancheOptions(nbPersonnes: number | null | undefined): TrancheOption[] {
  const p = clampPersons(nbPersonnes ?? 1)
  const t = INCOME_HORS_IDF[p]!

  const suffix = p === 5 ? 'foyer 5 personnes ou plus' : `foyer de ${p} personne${p > 1 ? 's' : ''}`

  return [
    {
      value: 'tres_modeste',
      label: `Moins de ${fmt(t.tres_modeste)}`,
      description: `Très modestes — primes majorées (${suffix})`,
    },
    {
      value: 'modeste',
      label: `${fmt(t.tres_modeste + 1)} – ${fmt(t.modeste)}`,
      description: `Modestes — primes Coup de pouce (${suffix})`,
    },
    {
      value: 'intermediaire',
      label: `${fmt(t.modeste + 1)} – ${fmt(t.intermediaire)}`,
      description: `Intermédiaires — CEE standard (${suffix})`,
    },
    {
      value: 'superieur',
      label: `Plus de ${fmt(t.intermediaire)}`,
      description: `Supérieurs — CEE éligibles (${suffix})`,
    },
    {
      value: 'nr',
      label: 'Je préfère ne pas répondre',
      description: 'Nous ferons le calcul avec vous lors du rappel',
    },
  ]
}
