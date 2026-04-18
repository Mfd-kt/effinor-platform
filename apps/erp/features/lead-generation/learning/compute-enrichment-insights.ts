import type { LeadGenerationLearningInsight, LearningStockSample } from "./types";

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function computeEnrichmentInsights(stock: LearningStockSample[]): LeadGenerationLearningInsight[] {
  const insights: LeadGenerationLearningInsight[] = [];

  const byConfidence = new Map<string, { total: number; converted: number }>();
  let withEmail = 0;
  let withEmailConverted = 0;
  let withoutEmail = 0;
  let withoutEmailConverted = 0;
  let withDomain = 0;
  let withDomainConverted = 0;
  let withoutDomain = 0;
  let withoutDomainConverted = 0;

  for (const row of stock) {
    const converted = Boolean(row.converted_lead_id);
    const confidence = row.enrichment_confidence ?? "unknown";
    const c = byConfidence.get(confidence) ?? { total: 0, converted: 0 };
    c.total += 1;
    if (converted) c.converted += 1;
    byConfidence.set(confidence, c);

    const hasEmail = hasText(row.email) || hasText(row.enriched_email);
    if (hasEmail) {
      withEmail += 1;
      if (converted) withEmailConverted += 1;
    } else {
      withoutEmail += 1;
      if (converted) withoutEmailConverted += 1;
    }

    const hasDomainOrSite =
      hasText(row.website) || hasText(row.enriched_website) || hasText(row.enriched_domain);
    if (hasDomainOrSite) {
      withDomain += 1;
      if (converted) withDomainConverted += 1;
    } else {
      withoutDomain += 1;
      if (converted) withoutDomainConverted += 1;
    }
  }

  const confidenceRates = Array.from(byConfidence.entries()).map(([confidence, agg]) => ({
    confidence,
    total: agg.total,
    converted: agg.converted,
    rate: pct(agg.converted, agg.total),
  }));
  insights.push({
    category: "enrichment_impact",
    title: "Conversion par enrichment confidence",
    severity: "info",
    summary: "Distribution de conversion selon le niveau de confiance d’enrichissement.",
    evidence: { confidenceRates },
    recommendation:
      "Si `high` ou `medium` performent clairement, prioriser ces fiches dans les workflows commerciaux manuels.",
  });

  const emailRate = pct(withEmailConverted, withEmail);
  const noEmailRate = pct(withoutEmailConverted, withoutEmail);
  if (withEmail >= 20 || withoutEmail >= 20) {
    insights.push({
      category: "enrichment_impact",
      title: "Impact présence email",
      severity: emailRate >= noEmailRate ? "success" : "warning",
      summary: `Avec email: ${emailRate}% vs sans email: ${noEmailRate}% de conversion.`,
      evidence: {
        withEmail: { total: withEmail, converted: withEmailConverted, rate: emailRate },
        withoutEmail: { total: withoutEmail, converted: withoutEmailConverted, rate: noEmailRate },
      },
      recommendation:
        "Prioriser les fiches enrichies en email dans la file commerciale, ou renforcer la collecte email sur les sources faibles.",
    });
  }

  const domainRate = pct(withDomainConverted, withDomain);
  const noDomainRate = pct(withoutDomainConverted, withoutDomain);
  if (withDomain >= 20 || withoutDomain >= 20) {
    insights.push({
      category: "enrichment_impact",
      title: "Impact domaine/site confirmé",
      severity: domainRate >= noDomainRate ? "success" : "warning",
      summary: `Avec domaine/site: ${domainRate}% vs sans: ${noDomainRate}% de conversion.`,
      evidence: {
        withDomainOrSite: { total: withDomain, converted: withDomainConverted, rate: domainRate },
        withoutDomainOrSite: { total: withoutDomain, converted: withoutDomainConverted, rate: noDomainRate },
      },
      recommendation:
        "Augmenter la vérification domaine/site pour les segments où l’écart de conversion est significatif.",
    });
  }

  return insights;
}
