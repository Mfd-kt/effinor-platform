import type {
  LeadGenerationLearningInsight,
  LearningImportSample,
  LearningStockSample,
} from "./types";

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export function computeSourcePerformanceInsights(input: {
  imports: LearningImportSample[];
  stock: LearningStockSample[];
}): LeadGenerationLearningInsight[] {
  const bySource = new Map<
    string,
    {
      imported: number;
      accepted: number;
      duplicates: number;
      rejected: number;
      stockCount: number;
      converted: number;
      scoreSum: number;
      scoreCount: number;
    }
  >();

  for (const source of ["apify_google_maps", "csv_manual"]) {
    bySource.set(source, {
      imported: 0,
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      stockCount: 0,
      converted: 0,
      scoreSum: 0,
      scoreCount: 0,
    });
  }

  for (const row of input.imports) {
    const agg = bySource.get(row.source) ?? {
      imported: 0,
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      stockCount: 0,
      converted: 0,
      scoreSum: 0,
      scoreCount: 0,
    };
    agg.imported += row.imported_count ?? 0;
    agg.accepted += row.accepted_count ?? 0;
    agg.duplicates += row.duplicate_count ?? 0;
    agg.rejected += row.rejected_count ?? 0;
    bySource.set(row.source, agg);
  }

  for (const stock of input.stock) {
    const agg = bySource.get(stock.source) ?? {
      imported: 0,
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      stockCount: 0,
      converted: 0,
      scoreSum: 0,
      scoreCount: 0,
    };
    agg.stockCount += 1;
    if (stock.converted_lead_id) {
      agg.converted += 1;
    }
    if (typeof stock.commercial_score === "number") {
      agg.scoreSum += stock.commercial_score;
      agg.scoreCount += 1;
    }
    bySource.set(stock.source, agg);
  }

  const insights: LeadGenerationLearningInsight[] = [];
  for (const [source, a] of bySource.entries()) {
    const duplicateRate = pct(a.duplicates, a.imported);
    const rejectRate = pct(a.rejected, a.imported);
    const acceptRate = pct(a.accepted, a.imported);
    const conversionRate = pct(a.converted, a.stockCount);
    const avgScore = a.scoreCount > 0 ? Math.round((a.scoreSum / a.scoreCount) * 10) / 10 : 0;

    if (a.imported > 0 && duplicateRate >= 30) {
      insights.push({
        category: "source_performance",
        title: `${source}: taux de doublon élevé`,
        severity: "warning",
        summary: `Le taux de doublon est de ${duplicateRate}% sur ${a.imported} lignes importées.`,
        evidence: { source, duplicateRate, imported: a.imported, duplicates: a.duplicates },
        recommendation:
          "Renforcer la normalisation amont (raison sociale, téléphone, SIRET) avant import pour cette source.",
      });
    }

    if (a.imported > 0 && rejectRate >= 20) {
      insights.push({
        category: "source_performance",
        title: `${source}: rejet important`,
        severity: "warning",
        summary: `Le taux de rejet atteint ${rejectRate}% sur cette source.`,
        evidence: { source, rejectRate, imported: a.imported, rejected: a.rejected },
        recommendation:
          "Ajouter des contrôles de qualité d’entrée (téléphone, cohérence ville/SIRET, colonnes obligatoires).",
      });
    }

    if (a.stockCount >= 20 && conversionRate >= 12) {
      insights.push({
        category: "source_performance",
        title: `${source}: source performante`,
        severity: "success",
        summary: `Conversion stock -> lead de ${conversionRate}% avec score moyen ${avgScore}.`,
        evidence: { source, conversionRate, stockCount: a.stockCount, converted: a.converted, avgScore },
        recommendation:
          "Prioriser cette source dans les imports manuels et documenter ses patterns de qualité.",
      });
    }

    if (a.imported > 0 && a.stockCount > 0) {
      insights.push({
        category: "source_performance",
        title: `${source}: vue synthétique`,
        severity: "info",
        summary: `Acceptation ${acceptRate}% · doublons ${duplicateRate}% · rejets ${rejectRate}% · conversion ${conversionRate}%.`,
        evidence: { source, acceptRate, duplicateRate, rejectRate, conversionRate, avgScore },
        recommendation:
          "Suivre ces ratios dans le temps (hebdo/mois) pour confirmer les tendances avant ajustement des règles.",
      });
    }
  }

  return insights;
}
