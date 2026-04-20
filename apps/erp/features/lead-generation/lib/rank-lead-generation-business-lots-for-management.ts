import type { BusinessOutcomeCounts } from "../queries/get-lead-generation-management-business-outcomes";
import type { BatchManagementRow } from "../queries/get-lead-generation-management-dashboard";

/**
 * Pondération du score business (lots) — ordre métier : installation → VT → accord → RDV.
 * Pas de décimales : tri lexicographique sur les comptes donnerait le même ordre, ce score sert au tri et à l’affichage.
 */
export const BUSINESS_LOT_WEIGHT_INSTALLATION = 1000;
export const BUSINESS_LOT_WEIGHT_VT = 100;
export const BUSINESS_LOT_WEIGHT_ACCORD = 10;
export const BUSINESS_LOT_WEIGHT_RDV = 1;

/** Top : au moins 3 fiches converties dans la période, ou 1+ convertie avec au moins un outcome réel. */
export const TOP_BUSINESS_LOT_MIN_CONVERTED_STRICT = 3;
export const TOP_BUSINESS_LOT_MIN_CONVERTED_WITH_OUTCOME = 1;

/** Bottom : volume d’entrée non trivial + assez de convertis pour attendre du résultat. */
export const BOTTOM_BUSINESS_LOT_MIN_CONVERTED = 5;
export const BOTTOM_BUSINESS_LOT_MIN_IMPORTED_RAW = 20;
export const BOTTOM_BUSINESS_LOT_MIN_ACCEPTED = 15;

/** Il faut au moins 2 lots éligibles de chaque côté pour afficher un Top / Bottom crédible. */
export const BUSINESS_LOT_LEADERBOARD_MIN_ELIGIBLE_PER_SIDE = 2;

const TOP_BADGES = ["Très rentable", "Fort potentiel", "Top business"] as const;
const BOTTOM_BADGES = ["À surveiller", "Faible rendement", "Sous-performant"] as const;

export type RankedBusinessLotEntry = {
  displayRank: number;
  badgeLabel: string;
  batch: BatchManagementRow;
  /** Score pondéré (installations / VT / accords / RDV). */
  businessScore: number;
};

export type BusinessLotLeaderboardResult =
  | { kind: "insufficient"; message: string }
  | { kind: "ok"; top: RankedBusinessLotEntry[]; bottom: RankedBusinessLotEntry[] };

export function businessLotOutcomeScore(b: BusinessOutcomeCounts): number {
  return (
    b.withInstallation * BUSINESS_LOT_WEIGHT_INSTALLATION +
    b.withVt * BUSINESS_LOT_WEIGHT_VT +
    b.withAccord * BUSINESS_LOT_WEIGHT_ACCORD +
    b.withRdv * BUSINESS_LOT_WEIGHT_RDV
  );
}

function hasAnyBusinessOutcome(b: BusinessOutcomeCounts): boolean {
  return b.withRdv + b.withAccord + b.withVt + b.withInstallation > 0;
}

function isTopEligible(row: BatchManagementRow): boolean {
  const c = row.business.convertedLeads;
  if (c >= TOP_BUSINESS_LOT_MIN_CONVERTED_STRICT) {
    return true;
  }
  return c >= TOP_BUSINESS_LOT_MIN_CONVERTED_WITH_OUTCOME && hasAnyBusinessOutcome(row.business);
}

function isBottomEligible(row: BatchManagementRow): boolean {
  const volumeOk =
    row.importedRaw >= BOTTOM_BUSINESS_LOT_MIN_IMPORTED_RAW ||
    row.accepted >= BOTTOM_BUSINESS_LOT_MIN_ACCEPTED;
  return volumeOk && row.business.convertedLeads >= BOTTOM_BUSINESS_LOT_MIN_CONVERTED;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Classement directionnel des lots sur les outcomes déjà agrégés (`batch.business`).
 * - Top : score décroissant, ex-aequo → plus de convertis, puis plus de brut importé.
 * - Bottom : score croissant parmi les lots volumineux, ex-aequo → plus de convertis puis plus de brut (beaucoup de pipe, peu d’outcomes).
 */
export function rankLeadGenerationBusinessLots(batches: BatchManagementRow[]): BusinessLotLeaderboardResult {
  if (batches.length === 0) {
    return {
      kind: "insufficient",
      message:
        "Aucun lot sur ce périmètre. Élargissez les filtres (période, quantificateur, fiche CEE) pour obtenir un classement business.",
    };
  }

  const topPool = batches.filter(isTopEligible);
  const bottomPool = batches.filter(isBottomEligible);

  if (
    topPool.length < BUSINESS_LOT_LEADERBOARD_MIN_ELIGIBLE_PER_SIDE ||
    bottomPool.length < BUSINESS_LOT_LEADERBOARD_MIN_ELIGIBLE_PER_SIDE
  ) {
    return {
      kind: "insufficient",
      message:
        "Pas assez de lots éligibles pour un Top / Bottom business fiable. Il faut au moins deux lots avec au moins trois fiches converties dans la période (ou une convertie avec au moins un RDV, accord, VT ou installation) pour le haut de tableau, et deux lots avec au moins cinq convertis et un volume d’import significatif (brut ≥ 20 ou acceptés ≥ 15) pour le bas. Élargissez la période ou le périmètre.",
    };
  }

  const topSorted = [...topPool].sort((a, b) => {
    const sa = businessLotOutcomeScore(a.business);
    const sb = businessLotOutcomeScore(b.business);
    if (sb !== sa) {
      return sb - sa;
    }
    if (b.business.convertedLeads !== a.business.convertedLeads) {
      return b.business.convertedLeads - a.business.convertedLeads;
    }
    return b.importedRaw - a.importedRaw;
  });

  const bottomSorted = [...bottomPool].sort((a, b) => {
    const sa = businessLotOutcomeScore(a.business);
    const sb = businessLotOutcomeScore(b.business);
    if (sa !== sb) {
      return sa - sb;
    }
    if (b.business.convertedLeads !== a.business.convertedLeads) {
      return b.business.convertedLeads - a.business.convertedLeads;
    }
    return b.importedRaw - a.importedRaw;
  });

  const top: RankedBusinessLotEntry[] = topSorted.slice(0, 3).map((batch, i) => ({
    displayRank: i + 1,
    badgeLabel: TOP_BADGES[i] ?? TOP_BADGES[TOP_BADGES.length - 1],
    batch,
    businessScore: round1(businessLotOutcomeScore(batch.business)),
  }));

  const bottom: RankedBusinessLotEntry[] = bottomSorted.slice(0, 3).map((batch, i) => ({
    displayRank: i + 1,
    badgeLabel: BOTTOM_BADGES[i] ?? BOTTOM_BADGES[BOTTOM_BADGES.length - 1],
    batch,
    businessScore: round1(businessLotOutcomeScore(batch.business)),
  }));

  return { kind: "ok", top, bottom };
}
