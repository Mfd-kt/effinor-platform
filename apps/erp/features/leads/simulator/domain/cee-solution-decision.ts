/**
 * Logique CEE : une seule solution affichée — DESTRAT (BAT-TH-142 tertiaire ou IND-BA-110 industriel), PAC (BAT-TH-163) ou NONE.
 */

export type CeeBuildingType = "tertiaire" | "industriel" | "logistique" | "autre";

export type CeeHeatingKind = "convectif" | "radiatif" | "mixte" | "autre";

export type CeeNeed = "chauffage" | "chauffage_ecs" | "ecs_seule";

export type LocalUsageId =
  | "bureau"
  | "commerce"
  | "sante"
  | "enseignement"
  | "hotellerie_restauration"
  | "atelier"
  | "hall_production"
  | "gymnase"
  | "stockage"
  | "entrepot"
  | "logistique"
  | "reserve"
  | "autre";

/** Usages qui excluent la déstratification (éligibilité métier). */
export const DESTRAT_EXCLUDED_LOCAL_USAGES: ReadonlySet<LocalUsageId> = new Set([
  "stockage",
  "entrepot",
  "logistique",
  "reserve",
]);

/**
 * Usages tertiaires : orientation commerciale PAC (BAT-TH-163) plutôt que déstrat.
 * Pas de saisie hauteur côté simulateur agent pour ces profils.
 */
export const PAC_PRIORITY_LOCAL_USAGES: ReadonlySet<LocalUsageId> = new Set([
  "bureau",
  "sante",
  "hotellerie_restauration",
  "enseignement",
]);

export function isPacPreferredLocalUsage(usage: LocalUsageId | "" | undefined): boolean {
  if (!usage) return false;
  return PAC_PRIORITY_LOCAL_USAGES.has(usage);
}

/** Seuil métier : en dessous, pas de déstratification d'air ; orientation PAC si critères remplis. */
export const DESTRAT_MIN_HEIGHT_M = 5;

/** Types de bâtiment pour lesquels une PAC peut être proposée si la déstrat est exclue. */
const PAC_ELIGIBLE_BUILDING_TYPES: ReadonlySet<CeeBuildingType> = new Set([
  "tertiaire",
  "logistique",
  "industriel",
]);

/** Types de bâtiment éligibles à la déstrat d'air (fiche tertiaire ou industrielle). */
const DESTRAT_ELIGIBLE_BUILDING_TYPES: ReadonlySet<CeeBuildingType> = new Set(["tertiaire", "industriel"]);

export type CeeDestratSheetCode = "BAT-TH-142" | "IND-BA-110";

export type CeeSolutionKind = "DESTRAT" | "PAC" | "NONE";

export type CeeSolutionDecision = {
  solution: CeeSolutionKind;
  /** true si DESTRAT ou PAC */
  eligible: boolean;
  reason: string;
  commercialMessage: string;
  /** Fiche CEE déstrat (renseigné seulement si solution === DESTRAT). */
  destratCeeSheetCode?: CeeDestratSheetCode;
  /** Enrichissement message si solution DESTRAT uniquement */
  destratRelevanceHint?: string;
};

export type CeeDecisionInput = {
  isHeated: boolean;
  isClosed: boolean;
  buildingAgeMoreThan2Years: boolean;
  buildingType: CeeBuildingType;
  localUsage: LocalUsageId;
  heightM: number;
  setpointTemp: number;
  need: CeeNeed;
};

const MSG_DESTRAT =
  "Votre bâtiment présente des caractéristiques idéales pour une déstratification, permettant de réduire fortement les pertes de chaleur.";

const MSG_PAC =
  "Votre bâtiment n'est pas adapté à une déstratification. Une pompe à chaleur permet néanmoins de générer des économies d'énergie importantes.";

const MSG_PAC_PRIORITY_USAGE =
  "Pour ce type d'établissement, nous recommandons plutôt une pompe à chaleur air/eau (BAT-TH-163) : la déstratification d'air n'est pas la solution privilégiée. Une étude PAC permettra de chiffrer précisément le projet.";

const MSG_NONE =
  "Votre configuration ne correspond pas aux dispositifs financés actuellement. Une étude spécifique est recommandée.";

export function destratRelevanceHint(heightM: number): string | undefined {
  if (heightM > 8) return "Potentiel déstratification élevé (grande hauteur sous plafond).";
  if (heightM >= 6) return "Potentiel déstratification modéré.";
  if (heightM >= 5) return "Potentiel déstratification limité par la hauteur.";
  return undefined;
}

export function evaluateDestratEligibility(input: CeeDecisionInput): boolean {
  if (!input.isHeated) return false;
  if (PAC_PRIORITY_LOCAL_USAGES.has(input.localUsage)) return false;
  /** Stockage, entrepôt, logistique, réserve → jamais de déstrat (PAC ou hors périmètre). */
  if (DESTRAT_EXCLUDED_LOCAL_USAGES.has(input.localUsage)) return false;
  if (!input.isClosed) return false;
  if (input.heightM < DESTRAT_MIN_HEIGHT_M) return false;
  if (input.setpointTemp < 15) return false;
  if (!DESTRAT_ELIGIBLE_BUILDING_TYPES.has(input.buildingType)) return false;
  return true;
}

export function evaluatePacEligibility(input: CeeDecisionInput): boolean {
  if (!input.buildingAgeMoreThan2Years) return false;
  if (!PAC_ELIGIBLE_BUILDING_TYPES.has(input.buildingType)) return false;
  if (input.need === "ecs_seule") return false;
  return true;
}

export function decideCeeSolution(input: CeeDecisionInput): CeeSolutionDecision {
  const destratEligible = evaluateDestratEligibility(input);

  if (destratEligible) {
    const hint = destratRelevanceHint(input.heightM);
    const destratCeeSheetCode: CeeDestratSheetCode =
      input.buildingType === "industriel" ? "IND-BA-110" : "BAT-TH-142";
    return {
      solution: "DESTRAT",
      eligible: true,
      reason: "Le bâtiment est éligible à une déstratification",
      commercialMessage: hint ? `${MSG_DESTRAT} ${hint}` : MSG_DESTRAT,
      destratCeeSheetCode,
      destratRelevanceHint: hint,
    };
  }

  const pacEligible = evaluatePacEligibility(input);

  if (pacEligible) {
    const priorityUsage = PAC_PRIORITY_LOCAL_USAGES.has(input.localUsage);
    const lowHeight = input.heightM < DESTRAT_MIN_HEIGHT_M;
    return {
      solution: "PAC",
      eligible: true,
      reason: priorityUsage
        ? "Usage tertiaire orienté pompe à chaleur plutôt que déstratification"
        : lowHeight
          ? `Hauteur sous plafond inférieure à ${DESTRAT_MIN_HEIGHT_M} m : déstratification non adaptée, orientation PAC`
          : "La déstratification n'est pas éligible, une PAC est recommandée",
      commercialMessage: priorityUsage
        ? MSG_PAC_PRIORITY_USAGE
        : lowHeight
          ? `Hauteur sous plafond inférieure à ${DESTRAT_MIN_HEIGHT_M} m : la déstratification d'air n'est en général pas pertinente. ${MSG_PAC}`
          : MSG_PAC,
    };
  }

  return {
    solution: "NONE",
    eligible: false,
    reason: "Aucune solution CEE adaptée à ce bâtiment",
    commercialMessage: MSG_NONE,
  };
}
