import type { LeadGenerationLeadTier } from "../domain/lead-tier";
import type { LeadGenerationStockRow } from "../domain/stock-row";

import { classifyLeadTierFromPremiumScore } from "./classify-lead-tier";

export type LeadGenerationPremiumScoreResult = {
  premiumScore: number;
  leadTier: LeadGenerationLeadTier;
  premiumReasons: string[];
};

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeForRoleMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function hasPremiumDecisionMakerRole(role: string | null | undefined): boolean {
  if (!hasText(role)) return false;
  const n = normalizeForRoleMatch(role!);
  return /(gerant|president|\bpdg\b|directeur|responsable\s+maintenance|responsable\s+technique|responsable\s+exploitation)/.test(
    n,
  );
}

function isHardExcluded(row: LeadGenerationStockRow): boolean {
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return true;
  }
  if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
    return true;
  }
  if (row.dispatch_queue_status === "do_not_dispatch") {
    return true;
  }
  if (row.phone_status !== "found" || !hasText(row.normalized_phone)) {
    return true;
  }
  return false;
}

/**
 * Score premium pur (0–100) et classification tier — complémentaire au score commercial.
 */
export function computeLeadGenerationPremiumScore(row: LeadGenerationStockRow): LeadGenerationPremiumScoreResult {
  const premiumReasons: string[] = [];

  if (isHardExcluded(row)) {
    if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
      premiumReasons.push("Exclu : doublon");
    } else if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
      premiumReasons.push("Exclu : rejet");
    } else if (row.dispatch_queue_status === "do_not_dispatch") {
      premiumReasons.push("Exclu : ne pas diffuser");
    } else {
      premiumReasons.push("Exclu : téléphone absent ou non validé");
    }
    return {
      premiumScore: 0,
      leadTier: classifyLeadTierFromPremiumScore(0),
      premiumReasons,
    };
  }

  let score = 0;

  if (hasText(row.decision_maker_name)) {
    score += 25;
    premiumReasons.push("Décideur : nom identifié (+25)");
  }

  if (hasPremiumDecisionMakerRole(row.decision_maker_role)) {
    score += 20;
    premiumReasons.push("Décideur : rôle cible (+20)");
  }

  const conf = row.decision_maker_confidence;
  if (conf === "high") {
    score += 20;
    premiumReasons.push("Confiance décideur : forte (+20)");
  } else if (conf === "medium") {
    score += 10;
    premiumReasons.push("Confiance décideur : moyenne (+10)");
  }

  const enrichedEmailReal =
    hasText(row.enriched_email) &&
    (row.enrichment_confidence === "medium" || row.enrichment_confidence === "high");
  const publicEmailOk =
    row.email_status === "found" && (hasText(row.email) || hasText(row.enriched_email));

  if (publicEmailOk || enrichedEmailReal) {
    score += 15;
    premiumReasons.push("Contact : email exploitable (+15)");
  }

  const websiteOk =
    row.website_status === "found" ||
    hasText(row.enriched_website) ||
    hasText(row.enriched_domain);

  if (websiteOk) {
    score += 10;
    premiumReasons.push("Site web confirmé ou enrichi (+10)");
  }

  if (row.commercial_priority === "critical") {
    score += 10;
    premiumReasons.push("Priorité commerciale : critique (+10)");
  } else if (row.commercial_priority === "high") {
    score += 5;
    premiumReasons.push("Priorité commerciale : élevée (+5)");
  }

  if (row.dispatch_queue_status === "ready_now") {
    score += 10;
    premiumReasons.push("File : prêt maintenant (+10)");
  }

  const capped = Math.min(100, Math.max(0, score));
  const leadTier = classifyLeadTierFromPremiumScore(capped);

  return {
    premiumScore: capped,
    leadTier,
    premiumReasons,
  };
}
