import type {
  QuantifierPersonalAlert,
  QuantifierPersonalDashboardData,
} from "../domain/quantifier-personal-dashboard";
import {
  ALERT_BUSY_DAY_RETURN_WEEK_PERCENT,
  ALERT_BUSY_DAY_TREATED,
  ALERT_GOOD_QUALIFIED_FRACTION_OF_TARGET,
  ALERT_GOOD_QUALIFY_RATE_7D_PERCENT,
  ALERT_GOOD_RHYTHM_FRACTION_OF_TARGET,
  ALERT_LOW_RETURN_FOR_QUALITY_7D_PERCENT,
  ALERT_OOT_TODAY_WARNING,
  ALERT_OOT_WEEK_WARNING,
  ALERT_RETURN_RATE_DANGER_7D_PERCENT,
  ALERT_RETURN_RATE_WARNING_7D_PERCENT,
  ALERT_RETURN_TREND_WEEK_OVER_MONTH_PERCENT,
  ALERT_RHYTHM_LOW_FRACTION_OF_TARGET,
  ALERT_SCORE_GAP_BELOW_TEAM_AVERAGE,
} from "./quantifier-personal-alerts-config";

export type { QuantifierPersonalAlert, QuantifierPersonalAlertKind } from "../domain/quantifier-personal-dashboard";

type Input = Omit<QuantifierPersonalDashboardData, "alerts">;

function pickAlerts(candidates: QuantifierPersonalAlert[]): QuantifierPersonalAlert[] {
  const critical = candidates
    .filter((c) => c.kind === "danger" || c.kind === "warning")
    .sort((a, b) => a.priority - b.priority);
  if (critical.length > 0) {
    return critical.slice(0, 3);
  }
  const positive = candidates
    .filter((c) => c.kind === "positive")
    .sort((a, b) => a.priority - b.priority);
  if (positive.length > 0) {
    return positive.slice(0, 3);
  }
  return [
    {
      kind: "neutral",
      priority: 1000,
      title: "Rien à signaler",
      message: "Ton activité est stable pour le moment.",
      actionHint: "Ouvre la file quand tu peux pour garder le cap.",
    },
  ];
}

/**
 * Alertes cockpit quantificateur — uniquement à partir des métriques déjà agrégées du dashboard personnel.
 */
export function buildLeadGenerationQuantifierPersonalAlerts(data: Input): QuantifierPersonalAlert[] {
  const { today, week, month, score, ranking, goals } = data;
  const candidates: QuantifierPersonalAlert[] = [];

  const ret7 = week.returnRatePercent;
  const retMonth = month.returnRatePercent;
  const q7 = week.qualifyRatePercent;
  const bizSum = week.withRdv + week.withAccord + week.withVt + week.withInstallation;

  // —— Danger ——
  if (today.treated === 0) {
    candidates.push({
      kind: "danger",
      priority: 1,
      title: "Aucune activité aujourd’hui",
      message: "Tu n’as encore traité aucun lead aujourd’hui.",
      actionHint: "Ouvre la file à qualifier et enchaîne quelques fiches.",
    });
  }

  if (ret7 != null && ret7 >= ALERT_RETURN_RATE_DANGER_7D_PERCENT) {
    candidates.push({
      kind: "danger",
      priority: 2,
      title: "Taux de retour commercial très élevé",
      message: `Sur 7 jours, environ ${ret7} % de tes qualifications reviennent avec un retour commercial — beaucoup plus que l’habitude.`,
      actionHint: "Vérifie le ciblage et la complétude des fiches avant qualification.",
    });
  }

  // —— Warning ——
  if (ret7 != null && ret7 >= ALERT_RETURN_RATE_WARNING_7D_PERCENT && ret7 < ALERT_RETURN_RATE_DANGER_7D_PERCENT) {
    candidates.push({
      kind: "warning",
      priority: 10,
      title: "Ton taux de retour commercial monte",
      message: `Environ ${ret7} % de retours sur tes qualifications (7 j). Les commerciaux renvoient plus de fiches que d’habitude.`,
      actionHint: "Mieux cadrer le besoin en amont réduit les renvois.",
    });
  }

  if (
    ret7 != null &&
    retMonth != null &&
    ret7 >= retMonth + ALERT_RETURN_TREND_WEEK_OVER_MONTH_PERCENT &&
    ret7 >= ALERT_RETURN_RATE_WARNING_7D_PERCENT
  ) {
    candidates.push({
      kind: "warning",
      priority: 11,
      title: "Tendance : retours en hausse",
      message: "Ton taux de retour sur 7 j est nettement plus haut que sur 30 j.",
      actionHint: "Identifie les motifs de retour récents dans l’historique.",
    });
  }

  if (today.treated > 0 && today.treated < goals.targetTreated * ALERT_RHYTHM_LOW_FRACTION_OF_TARGET) {
    candidates.push({
      kind: "warning",
      priority: 12,
      title: "Rythme lent aujourd’hui",
      message: `Tu es en dessous de l’objectif du jour (${today.treated} traités pour ${goals.targetTreated} visés).`,
      actionHint: "Enchaîne quelques décisions courtes pour remonter la pente.",
    });
  }

  if (today.outOfTarget >= ALERT_OOT_TODAY_WARNING || (week.outOfTarget >= ALERT_OOT_WEEK_WARNING && week.treated >= 8)) {
    candidates.push({
      kind: "warning",
      priority: 13,
      title: "Beaucoup de hors cible",
      message:
        today.outOfTarget >= ALERT_OOT_TODAY_WARNING
          ? "Tu as marqué beaucoup de hors cible aujourd’hui."
          : "Sur 7 j, le volume de hors cible est élevé par rapport à ton activité.",
      actionHint: "Affine la recherche / le ciblage en amont pour éviter le bruit.",
    });
  }

  if (
    today.treated >= ALERT_BUSY_DAY_TREATED &&
    ret7 != null &&
    ret7 >= ALERT_BUSY_DAY_RETURN_WEEK_PERCENT
  ) {
    candidates.push({
      kind: "warning",
      priority: 14,
      title: "Tu produis, mais la qualité baisse",
      message: "Bon volume aujourd’hui, en revanche tes retours commerciaux sur 7 j restent élevés.",
      actionHint: "Privilégie la précision : un peu moins vite mais plus propre.",
    });
  }

  if (
    ranking.teamAverageScore != null &&
    !ranking.aboveAverage &&
    score.value + ALERT_SCORE_GAP_BELOW_TEAM_AVERAGE <= ranking.teamAverageScore
  ) {
    candidates.push({
      kind: "warning",
      priority: 15,
      title: "En dessous de la moyenne de l’équipe",
      message: `Ton score (7 j) est nettement sous la moyenne (${ranking.teamAverageScore}).`,
      actionHint: "Regarde le taux de retour et le partage qualif / hors cible.",
    });
  }

  // —— Positive (si aucune alerte critique, seules celles-ci seront retenues) ——
  if (
    today.treated >= goals.targetTreated * ALERT_GOOD_RHYTHM_FRACTION_OF_TARGET ||
    today.qualified >= goals.targetQualified * ALERT_GOOD_QUALIFIED_FRACTION_OF_TARGET
  ) {
    candidates.push({
      kind: "positive",
      priority: 50,
      title: "Très bon rythme aujourd’hui",
      message: "Tu tiens un bon rythme sur la journée.",
      actionHint: "Garde ce tempo si la qualité suit.",
    });
  }

  if (
    q7 != null &&
    q7 >= ALERT_GOOD_QUALIFY_RATE_7D_PERCENT &&
    (ret7 ?? 0) <= ALERT_LOW_RETURN_FOR_QUALITY_7D_PERCENT
  ) {
    candidates.push({
      kind: "positive",
      priority: 51,
      title: "Bonne qualité de qualification",
      message: "Tes leads tiennent bien après passage commercial (peu de retours, bon taux de qualification).",
      actionHint: "Continue sur ce modèle.",
    });
  }

  if (bizSum >= 1) {
    candidates.push({
      kind: "positive",
      priority: 52,
      title: "Tes leads avancent dans le pipe",
      message:
        bizSum >= 3
          ? "RDV, accords, VT ou installations : tes conversions produisent du business réel."
          : "Tes leads génèrent déjà des RDV ou des étapes aval.",
      actionHint: "Les bons ciblages se voient en aval.",
    });
  }

  if (ranking.aboveAverage && ranking.teamAverageScore != null && ranking.position != null) {
    candidates.push({
      kind: "positive",
      priority: 53,
      title: "Au-dessus de la moyenne de l’équipe",
      message: `Ton score 7 j est au niveau ou au-dessus de la moyenne (${ranking.teamAverageScore}).`,
      actionHint: "Bravo — reste régulier.",
    });
  }

  return pickAlerts(candidates);
}
