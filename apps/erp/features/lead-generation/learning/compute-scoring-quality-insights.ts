import type { LeadGenerationLearningInsight, LearningStockSample } from "./types";

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export function computeScoringQualityInsights(stock: LearningStockSample[]): LeadGenerationLearningInsight[] {
  const insights: LeadGenerationLearningInsight[] = [];

  const scoreBands = [
    { key: "0-29", min: 0, max: 29, total: 0, converted: 0 },
    { key: "30-54", min: 30, max: 54, total: 0, converted: 0 },
    { key: "55-74", min: 55, max: 74, total: 0, converted: 0 },
    { key: "75-100", min: 75, max: 100, total: 0, converted: 0 },
  ];
  const byPriority = new Map<string, { total: number; converted: number }>();
  const byQueue = new Map<string, { total: number; converted: number }>();

  for (const row of stock) {
    const score = row.commercial_score ?? 0;
    const band = scoreBands.find((b) => score >= b.min && score <= b.max);
    if (band) {
      band.total += 1;
      if (row.converted_lead_id) band.converted += 1;
    }

    const p = row.commercial_priority ?? "unknown";
    const q = row.dispatch_queue_status ?? "unknown";
    const pAgg = byPriority.get(p) ?? { total: 0, converted: 0 };
    const qAgg = byQueue.get(q) ?? { total: 0, converted: 0 };
    pAgg.total += 1;
    qAgg.total += 1;
    if (row.converted_lead_id) {
      pAgg.converted += 1;
      qAgg.converted += 1;
    }
    byPriority.set(p, pAgg);
    byQueue.set(q, qAgg);
  }

  const ratesByBand = scoreBands.map((b) => ({ band: b.key, rate: pct(b.converted, b.total), ...b }));
  const lowRate = ratesByBand.find((b) => b.band === "0-29")?.rate ?? 0;
  const highRate = ratesByBand.find((b) => b.band === "75-100")?.rate ?? 0;
  if (highRate < lowRate && ratesByBand.some((b) => b.total >= 20)) {
    insights.push({
      category: "scoring_quality",
      title: "Inversion potentielle des bandes de score",
      severity: "warning",
      summary: `Le taux de conversion de la bande haute (${highRate}%) est inférieur à la bande basse (${lowRate}%).`,
      evidence: { bands: ratesByBand },
      recommendation:
        "Revoir les pondérations de score commercial et vérifier les règles de qualification sur les fiches haut score.",
    });
  } else {
    insights.push({
      category: "scoring_quality",
      title: "Conversion par bandes de score",
      severity: "info",
      summary: "Distribution conversion stock -> lead par bande de score disponible.",
      evidence: { bands: ratesByBand },
      recommendation:
        "Utiliser ces bandes pour valider ou ajuster manuellement les seuils de priorité dans les réglages.",
    });
  }

  const prioRates = Array.from(byPriority.entries())
    .map(([priority, a]) => ({ priority, total: a.total, converted: a.converted, rate: pct(a.converted, a.total) }))
    .sort((a, b) => b.rate - a.rate);
  insights.push({
    category: "scoring_quality",
    title: "Conversion par priorité commerciale",
    severity: "info",
    summary: "Comparaison des conversions selon la priorité commerciale attribuée.",
    evidence: { priorities: prioRates },
    recommendation:
      "Si les priorités hautes ne performent pas mieux, réduire l’optimisme du score ou augmenter les critères de preuve.",
  });

  const queueRates = Array.from(byQueue.entries())
    .map(([status, a]) => ({ dispatchQueueStatus: status, total: a.total, converted: a.converted, rate: pct(a.converted, a.total) }))
    .sort((a, b) => b.rate - a.rate);
  insights.push({
    category: "scoring_quality",
    title: "Conversion par dispatch queue status",
    severity: "info",
    summary: "Mesure de l’alignement entre décision de file de dispatch et conversion réelle.",
    evidence: { queue: queueRates },
    recommendation:
      "Surveiller les statuts à fort volume mais faible conversion pour ajuster les règles queue dans un second temps.",
  });

  return insights;
}
