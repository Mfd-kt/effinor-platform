/** Volume minimum de qualifications (période) pour entrer dans le Top / Bottom — évite les classements sur très peu de fiches. */
export const LEADERBOARD_MIN_QUALIFICATION_EVENTS = 10;

const TOP_BADGES = ["Excellent", "Très bon", "Bon"] as const;
const BOTTOM_BADGES = ["À surveiller", "Faible performance", "Sous pression"] as const;

/** Données quantificateur déjà agrégées (ex. {@link QuantifierManagementRow}). */
export type QuantifierLeaderboardMetrics = {
  displayName: string;
  qualifiedEventsInPeriod: number;
  qualifyRatePercent: number | null;
  returnRatePercent: number | null;
};

export type RankedQuantifierLeaderboardEntry<T extends QuantifierLeaderboardMetrics = QuantifierLeaderboardMetrics> = {
  displayRank: number;
  badgeLabel: string;
  quantifier: T;
  /** Score = taux qualification − taux retour (points). */
  score: number;
};

export type QuantifierLeaderboardResult<T extends QuantifierLeaderboardMetrics = QuantifierLeaderboardMetrics> =
  | { kind: "hidden" }
  | { kind: "insufficient"; message: string }
  | { kind: "ok"; top: RankedQuantifierLeaderboardEntry<T>[]; bottom: RankedQuantifierLeaderboardEntry<T>[] };

type RankInput<T extends QuantifierLeaderboardMetrics> = {
  rows: T[];
  /** Si un seul quantificateur est déjà sélectionné dans les filtres, le classement comparatif est masqué. */
  singleQuantifierFilter: boolean;
};

/**
 * Classement directionnel des quantificateurs à partir des lignes déjà agrégées du dashboard management.
 *
 * Score = `taux de qualification` − `taux de retour commercial` (même période).
 * - Un retour élevé pénalise le score ; une qualification élevée l’améliore.
 * - Taux de retour absent traité comme 0 %.
 * - Exclusion si `qualifyRatePercent` est null.
 */
export function rankLeadGenerationQuantifiersForManagement<T extends QuantifierLeaderboardMetrics>({
  rows,
  singleQuantifierFilter,
}: RankInput<T>): QuantifierLeaderboardResult<T> {
  if (singleQuantifierFilter) {
    return { kind: "hidden" };
  }

  const eligible = rows.filter(
    (q) =>
      q.qualifiedEventsInPeriod >= LEADERBOARD_MIN_QUALIFICATION_EVENTS && q.qualifyRatePercent != null,
  );

  if (eligible.length < 2) {
    if (eligible.length === 0) {
      return {
        kind: "insufficient",
        message:
          "Pas assez de volume pour établir un classement fiable. Il faut au moins deux quantificateurs avec chacun 10 qualifications ou plus sur la période, et un taux de qualification calculable.",
      };
    }
    return {
      kind: "insufficient",
      message:
        "Un seul quantificateur avec un volume suffisant sur cette période — le classement comparatif nécessite au moins deux profils éligibles.",
    };
  }

  const scored = eligible.map((q) => ({
    quantifier: q,
    score: (q.qualifyRatePercent as number) - (q.returnRatePercent ?? 0),
  }));

  const byScoreDesc = [...scored].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.quantifier.qualifiedEventsInPeriod !== a.quantifier.qualifiedEventsInPeriod) {
      return b.quantifier.qualifiedEventsInPeriod - a.quantifier.qualifiedEventsInPeriod;
    }
    return a.quantifier.displayName.localeCompare(b.quantifier.displayName, "fr");
  });

  const byScoreAsc = [...scored].sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    if (b.quantifier.qualifiedEventsInPeriod !== a.quantifier.qualifiedEventsInPeriod) {
      return b.quantifier.qualifiedEventsInPeriod - a.quantifier.qualifiedEventsInPeriod;
    }
    return a.quantifier.displayName.localeCompare(b.quantifier.displayName, "fr");
  });

  const top = byScoreDesc.slice(0, 3).map((item, i) => ({
    displayRank: i + 1,
    badgeLabel: TOP_BADGES[i] ?? TOP_BADGES[TOP_BADGES.length - 1],
    quantifier: item.quantifier,
    score: round1(item.score),
  }));

  const bottom = byScoreAsc.slice(0, 3).map((item, i) => ({
    displayRank: i + 1,
    badgeLabel: BOTTOM_BADGES[i] ?? BOTTOM_BADGES[BOTTOM_BADGES.length - 1],
    quantifier: item.quantifier,
    score: round1(item.score),
  }));

  return { kind: "ok", top, bottom };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
