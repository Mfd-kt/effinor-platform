import type {
  LeadGenerationLearningInsight,
  LearningActivitySample,
  LearningAssignmentSample,
} from "./types";

function topCounts(items: Array<string | null | undefined>, cap = 5) {
  const map = new Map<string, number>();
  for (const v of items) {
    const key = (v ?? "unknown").trim?.() || String(v ?? "unknown");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, cap);
}

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export function computeRecyclingInsights(input: {
  assignments: LearningAssignmentSample[];
  activities: LearningActivitySample[];
}): LeadGenerationLearningInsight[] {
  const insights: LeadGenerationLearningInsight[] = [];
  const assignmentIds = new Set(input.assignments.map((a) => a.id));
  const withActivity = new Set(
    input.activities.map((a) => a.assignment_id).filter((v): v is string => typeof v === "string" && v.length > 0),
  );
  const withoutActivity = Math.max(0, assignmentIds.size - withActivity.size);
  const withoutActivityRate = pct(withoutActivity, assignmentIds.size);

  const recycleReasonsTop = topCounts(input.assignments.map((a) => a.recycle_reason).filter(Boolean));
  const outcomesTop = topCounts(input.activities.map((a) => a.outcome).filter(Boolean));
  const now = Date.now();
  const overdueFollowUps = input.activities.filter((a) => {
    if (!a.next_action_at) return false;
    return new Date(a.next_action_at).getTime() < now;
  }).length;

  insights.push({
    category: "operational_friction",
    title: "Assignments sans activité",
    severity: withoutActivityRate >= 40 ? "warning" : "info",
    summary: `${withoutActivity} assignments sans activité (${withoutActivityRate}%).`,
    evidence: {
      assignmentsTotal: assignmentIds.size,
      assignmentsWithActivity: withActivity.size,
      assignmentsWithoutActivity: withoutActivity,
      assignmentsWithoutActivityRate: withoutActivityRate,
    },
    recommendation:
      "Analyser les segments non traités (source, queue, agent) et renforcer les rappels commerciaux sur ces poches.",
  });

  insights.push({
    category: "operational_friction",
    title: "Recycle reasons fréquentes",
    severity: "info",
    summary: "Top des motifs de recyclage observés dans les assignations.",
    evidence: { topRecycleReasons: recycleReasonsTop },
    recommendation:
      "Utiliser ces motifs pour prioriser les actions qualité (données manquantes, ciblage, timing).",
  });

  insights.push({
    category: "operational_friction",
    title: "Outcomes d’activités fréquents",
    severity: "info",
    summary: "Top des outcomes saisis dans les activités commerciales.",
    evidence: { topActivityOutcomes: outcomesTop },
    recommendation:
      "Créer un plan d’amélioration des scripts commerciaux pour les outcomes les plus fréquents mais peu progressifs.",
  });

  insights.push({
    category: "operational_friction",
    title: "Relances en retard",
    severity: overdueFollowUps >= 20 ? "warning" : "info",
    summary: `${overdueFollowUps} follow-ups dépassés détectés.`,
    evidence: { overdueFollowUps },
    recommendation:
      "Traiter les relances en retard en priorité opérationnelle pour limiter la perte de conversion.",
  });

  return insights;
}
