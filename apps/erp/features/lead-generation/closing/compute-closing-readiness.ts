import type { LeadGenerationClosingReadinessStatus, LeadGenerationStockRow } from "../domain/stock-row";
import { classifyClosingReadinessStatus } from "./classify-closing-readiness";
import { computeLeadGenerationApproachAngle } from "./compute-approach-angle";

export type LeadGenerationClosingReadinessComputed = {
  score: number;
  status: LeadGenerationClosingReadinessStatus;
  reasons: string[];
  approachAngle: string;
  approachHook: string;
};

function hasUsefulEmail(row: LeadGenerationStockRow): boolean {
  const e = row.email?.trim() || row.enriched_email?.trim();
  return Boolean(e && e.includes("@"));
}

function hasConfirmedSite(row: LeadGenerationStockRow): boolean {
  return row.website_status === "found" && Boolean(row.website?.trim() || row.enriched_website?.trim());
}

function isBlocked(row: LeadGenerationStockRow): boolean {
  if (row.stock_status === "rejected" || row.qualification_status === "rejected") return true;
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") return true;
  if (row.dispatch_queue_status === "do_not_dispatch") return true;
  if (row.phone_status !== "found" || !row.normalized_phone?.trim()) return true;
  return false;
}

function premiumBonus(row: LeadGenerationStockRow): { add: number; reasons: string[] } {
  const out: string[] = [];
  let add = 0;
  if (row.lead_tier === "premium") {
    add += 15;
    out.push("Lead classé premium");
  }
  if (row.premium_score >= 75) {
    add += 8;
    out.push("Signal premium fort");
  } else if (row.premium_score >= 55) {
    add += 4;
    out.push("Signal premium correct");
  }
  return { add: Math.min(20, add), reasons: out };
}

/**
 * Score 0–100 pour la préparation au closing (commercial terrain).
 */
export function computeLeadGenerationClosingReadiness(row: LeadGenerationStockRow): LeadGenerationClosingReadinessComputed {
  const reasons: string[] = [];
  const approach = computeLeadGenerationApproachAngle(row);

  if (isBlocked(row)) {
    return {
      score: 0,
      status: "low",
      reasons: ["Fiche non exploitable pour le closing (téléphone, doublon ou blocage dispatch)."],
      approachAngle: approach.approachAngle,
      approachHook: approach.approachHook,
    };
  }

  let score = 5;
  reasons.push("Téléphone joignable");

  if (hasUsefulEmail(row)) {
    score += 10;
    reasons.push("Email utile");
  }
  if (hasConfirmedSite(row)) {
    score += 10;
    reasons.push("Site web renseigné");
  }

  const dmName = row.decision_maker_name?.trim();
  if (dmName) {
    score += 25;
    reasons.push("Nom du décideur identifié");
  }

  const role = row.decision_maker_role?.trim();
  if (role) {
    const strong =
      /directeur|gérant|président|pdg|maintenance|technique|responsable|exploitation/i.test(role);
    if (strong) {
      score += 20;
      reasons.push("Rôle opérationnel ou direction utile");
    } else {
      score += 10;
      reasons.push("Fonction renseignée");
    }
  }

  if (row.decision_maker_confidence === "high") {
    score += 20;
    reasons.push("Confiance décideur élevée");
  } else if (row.decision_maker_confidence === "medium") {
    score += 10;
    reasons.push("Confiance décideur moyenne");
  }

  const pb = premiumBonus(row);
  score += pb.add;
  reasons.push(...pb.reasons);

  if (row.dispatch_queue_status === "ready_now") {
    score += 10;
    reasons.push("Priorisé pour contact immédiat");
  }
  if (row.commercial_priority === "high" || row.commercial_priority === "critical") {
    score += 10;
    reasons.push("Priorité commerciale haute");
  }

  if (row.linkedin_url?.trim()) {
    score += 10;
    reasons.push("Profil LinkedIn trouvé");
  } else if (row.has_linkedin) {
    score += 5;
    reasons.push("Signal LinkedIn présent");
  }

  if (!dmName && !role) {
    score = Math.min(score, 45);
    reasons.push("Décideur encore flou — plafonné");
  }

  if (row.dispatch_queue_status === "enrich_first") {
    score = Math.min(score, 55);
    reasons.push("File « à compléter » — score plafonné");
  }

  const capped = Math.max(0, Math.min(100, score));
  const status = classifyClosingReadinessStatus(capped);

  if (status !== "high" && capped >= 60 && !dmName) {
    /* garde-fou : pas « high » sans nom décideur crédible */
    return {
      score: Math.min(capped, 69),
      status: "medium",
      reasons: [...reasons, "Pas de nom décideur : closing limité"],
      approachAngle: approach.approachAngle,
      approachHook: approach.approachHook,
    };
  }

  return {
    score: capped,
    status,
    reasons,
    approachAngle: approach.approachAngle,
    approachHook: approach.approachHook,
  };
}
