import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationLinkedInCandidateReason } from "../domain/linkedin-candidate-reason";
import { lgTable } from "../lib/lg-db";
import {
  LINKEDIN_ENRICH_BATCH_HARD_CAP,
  LINKEDIN_ENRICH_MIN_COMMERCIAL_SCORE,
  LINKEDIN_ENRICH_MIN_SOURCE_SIGNAL,
} from "../lib/multi-source-source-signal";
import { inferCompanyDecisionMakerProfile } from "../enrichment/company-decision-maker-profile";

export type LinkedInEnrichmentTargetRow = {
  id: string;
  company_name: string;
  city: string | null;
  /** Présent si l’import a déjà une URL (page entreprise ou profil) — requis pour les actors type « profile URLs ». */
  linkedin_url: string | null;
  linkedin_candidate_reason: LeadGenerationLinkedInCandidateReason;
};

function parseBatchMax(): number {
  const raw = process.env.LINKEDIN_ENRICH_BATCH_MAX?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 40;
  if (!Number.isFinite(n) || n < 1) return 40;
  return Math.min(LINKEDIN_ENRICH_BATCH_HARD_CAP, n);
}

function pickReason(row: {
  lead_tier: string;
  commercial_score: number | null;
  source_signal_score: number | null;
  decision_maker_name: string | null;
  decision_maker_confidence: string | null;
  category: string | null;
  sub_category: string | null;
}): LeadGenerationLinkedInCandidateReason {
  if (row.lead_tier === "premium") return "premium_candidate";
  const profile = inferCompanyDecisionMakerProfile({
    category: row.category,
    sub_category: row.sub_category,
  });
  if (profile === "industrial_logistics") return "industry_target";
  const strongScore =
    (row.commercial_score ?? 0) >= LINKEDIN_ENRICH_MIN_COMMERCIAL_SCORE ||
    (row.source_signal_score ?? 0) >= LINKEDIN_ENRICH_MIN_SOURCE_SIGNAL;
  if (!row.decision_maker_name?.trim() && strongScore) return "high_score_no_decision_maker";
  if (row.decision_maker_confidence == null || row.decision_maker_confidence === "low") {
    return "decision_maker_low_confidence";
  }
  return "ready_now_weak_contact";
}

export type GetLeadGenerationStockForLinkedInEnrichmentInput = {
  importBatchId?: string | null;
  /**
   * Actors type « profile URLs » (ex. Mass LinkedIn Profile Scraper) : uniquement les lignes avec
   * `linkedin_url` renseignée (profil ou page entreprise).
   */
  requireLinkedInUrl?: boolean;
};

/**
 * Ciblage LinkedIn premium : prêts, téléphone, pas doublon, file forte ou priorité haute,
 * décideur absent ou confiance non « high », volume borné.
 */
export async function getLeadGenerationStockForLinkedInEnrichment(
  input?: GetLeadGenerationStockForLinkedInEnrichmentInput,
): Promise<LinkedInEnrichmentTargetRow[]> {
  const limit = parseBatchMax();
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const importBatchId = input?.importBatchId?.trim() || null;
  const requireLinkedInUrl = input?.requireLinkedInUrl === true;

  let q = stock
    .select(
      "id, company_name, city, linkedin_url, lead_tier, commercial_score, source_signal_score, decision_maker_name, decision_maker_confidence, category, sub_category",
    )
    .eq("stock_status", "ready")
    .eq("qualification_status", "qualified")
    .eq("phone_status", "found")
    .not("normalized_phone", "is", null)
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "duplicate")
    .eq("has_linkedin", false)
    .neq("dispatch_queue_status", "do_not_dispatch")
    .or("dispatch_queue_status.eq.ready_now,commercial_priority.in.(high,critical)")
    .or("decision_maker_name.is.null,decision_maker_confidence.is.null,decision_maker_confidence.neq.high")
    .or(
      `source_signal_score.gte.${LINKEDIN_ENRICH_MIN_SOURCE_SIGNAL},commercial_score.gte.${LINKEDIN_ENRICH_MIN_COMMERCIAL_SCORE}`,
    );

  if (requireLinkedInUrl) {
    q = q.not("linkedin_url", "is", null).neq("linkedin_url", "");
  }

  if (importBatchId) {
    q = q.eq("import_batch_id", importBatchId);
  }

  const { data, error } = await q
    .order("commercial_score", { ascending: false, nullsFirst: false })
    .order("source_signal_score", { ascending: false, nullsFirst: false })
    .order("dispatch_queue_rank", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Sélection enrichissement LinkedIn : ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    company_name: string;
    city: string | null;
    linkedin_url: string | null;
    lead_tier: string;
    commercial_score: number | null;
    source_signal_score: number | null;
    decision_maker_name: string | null;
    decision_maker_confidence: string | null;
    category: string | null;
    sub_category: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    company_name: r.company_name,
    city: r.city,
    linkedin_url: r.linkedin_url?.trim() ? r.linkedin_url.trim() : null,
    linkedin_candidate_reason: pickReason(r),
  }));
}
