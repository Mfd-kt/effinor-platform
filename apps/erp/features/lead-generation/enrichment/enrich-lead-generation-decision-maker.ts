import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { scrapeFirecrawlUrl } from "../firecrawl/client";
import { searchFirecrawlWeb } from "../firecrawl/search-web";
import { lgTable } from "../lib/lg-db";

import {
  decisionMakerRolePriorityRank,
  inferDecisionMakerRolePriorityFromRoleText,
  type LeadGenerationDecisionMakerRolePriority,
} from "../domain/decision-maker-role-priority";
import { orderedDecisionMakerSearchAngles, inferCompanyDecisionMakerProfile } from "./company-decision-maker-profile";
import { buildDecisionMakerScrapeUrls } from "./build-decision-maker-scrape-urls";
import {
  extractDecisionMakerFromPlainText,
  extractFromSearchHit,
  mergeDecisionMakerCandidates,
  type DecisionMakerCandidate,
} from "./extract-decision-maker-from-text";
import {
  attachRolePriority,
  pickBestDecisionMakerCandidate,
  type ScoredDecisionMakerCandidate,
} from "./pick-best-decision-maker-candidate";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function safeCompanyQuery(name: string): string {
  return name.replace(/["'«»]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export type EnrichLeadGenerationDecisionMakerResult = {
  stockId: string;
  status: "completed" | "failed";
  /** Aucune colonne vide à mettre à jour et extraction vide ou déjà complète. */
  skipped?: boolean;
  decision_maker_name?: string | null;
  decision_maker_role?: string | null;
  decision_maker_source?: string | null;
  decision_maker_confidence?: string | null;
  error?: string;
};

async function loadStockRow(stockId: string): Promise<LeadGenerationStockRow | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").eq("id", stockId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as LeadGenerationStockRow | null;
}

function isEligible(row: LeadGenerationStockRow): { ok: true } | { ok: false; reason: string } {
  if (!hasText(row.company_name)) {
    return { ok: false, reason: "Nom d’entreprise requis." };
  }
  if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
    return { ok: false, reason: "Fiche rejetée." };
  }
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return { ok: false, reason: "Doublon : action non applicable." };
  }
  return { ok: true };
}

async function tryWebsite(row: LeadGenerationStockRow): Promise<DecisionMakerCandidate | null> {
  const urls = buildDecisionMakerScrapeUrls(row);
  if (urls.length === 0) return null;
  let combined = "";
  for (const url of urls) {
    try {
      const res = await scrapeFirecrawlUrl({ url, timeoutMs: 35_000 });
      const md = res.data?.markdown?.trim() ?? "";
      if (md) combined += `\n\n${md}`;
    } catch {
      /* page suivante */
    }
  }
  if (!combined.trim()) return null;
  return extractDecisionMakerFromPlainText(combined, "website", "medium");
}

async function tryGoogleSearchAngles(
  companyName: string,
  profile: ReturnType<typeof inferCompanyDecisionMakerProfile>,
): Promise<ScoredDecisionMakerCandidate | null> {
  const q = safeCompanyQuery(companyName);
  if (q.length < 2) return null;
  const angles = orderedDecisionMakerSearchAngles(profile);
  const collected: ScoredDecisionMakerCandidate[] = [];

  for (const angle of angles) {
    const query = `"${q}" ${angle.querySuffix}`;
    const hits = await searchFirecrawlWeb({ query, limit: 5, scrapeMarkdown: false });
    for (const hit of hits) {
      if (hit.url.toLowerCase().includes("linkedin.com")) continue;
      const c = extractFromSearchHit(hit, "google", "low");
      const scored = attachRolePriority(c);
      if (scored && (scored.name || scored.role)) {
        collected.push(scored);
      }
    }
  }

  return pickBestDecisionMakerCandidate(collected);
}

async function tryLinkedInSearch(companyName: string): Promise<DecisionMakerCandidate | null> {
  const q = safeCompanyQuery(companyName);
  if (q.length < 2) return null;
  const query = `site:linkedin.com/in "${q}"`;
  const hits = await searchFirecrawlWeb({ query, limit: 5, scrapeMarkdown: false });
  for (const hit of hits) {
    if (!hit.url.toLowerCase().includes("linkedin.com")) continue;
    const c = extractFromSearchHit(hit, "linkedin", "high");
    if (c?.name || c?.role) return c;
  }
  return null;
}

/**
 * Identifie un décideur à partir de sources publiques uniquement (pages site, résultats de recherche).
 * Ne crée jamais de nom ou de rôle : extraction littérale avec mots-clés métier présents dans le texte.
 * Ne remplit que les colonnes `decision_maker_*` encore vides.
 */
export async function enrichLeadGenerationDecisionMaker(input: {
  stockId: string;
}): Promise<EnrichLeadGenerationDecisionMakerResult> {
  const { stockId } = input;
  const row = await loadStockRow(stockId);
  if (!row) {
    return { stockId, status: "failed", error: "Fiche introuvable." };
  }

  const elig = isEligible(row);
  if (!elig.ok) {
    return { stockId, status: "failed", error: elig.reason };
  }

  const nameFull = hasText(row.decision_maker_name);
  const roleFull = hasText(row.decision_maker_role);
  const srcFull = hasText(row.decision_maker_source);
  const confFull = hasText(row.decision_maker_confidence);

  if (nameFull && roleFull && srcFull && confFull) {
    return {
      stockId,
      status: "completed",
      skipped: true,
      decision_maker_name: row.decision_maker_name,
      decision_maker_role: row.decision_maker_role,
      decision_maker_source: row.decision_maker_source,
      decision_maker_confidence: row.decision_maker_confidence,
    };
  }

  let websiteCand: DecisionMakerCandidate | null = null;
  let googleCand: DecisionMakerCandidate | null = null;
  let linkedinCand: DecisionMakerCandidate | null = null;

  try {
    websiteCand = await tryWebsite(row);
  } catch {
    websiteCand = null;
  }

  const websiteComplete = Boolean(websiteCand?.name && websiteCand?.role);
  const profile = inferCompanyDecisionMakerProfile({
    category: row.category,
    sub_category: row.sub_category,
  });
  if (!websiteComplete) {
    try {
      googleCand = await tryGoogleSearchAngles(row.company_name, profile);
    } catch {
      googleCand = null;
    }
  }

  const afterGoogle = mergeDecisionMakerCandidates(websiteCand, googleCand, null);
  const needLinkedin = !afterGoogle?.name || !afterGoogle?.role;
  if (!websiteComplete && needLinkedin) {
    try {
      linkedinCand = await tryLinkedInSearch(row.company_name);
    } catch {
      linkedinCand = null;
    }
  }

  const merged = mergeDecisionMakerCandidates(websiteCand, googleCand, linkedinCand);
  if (!merged || (!merged.name && !merged.role)) {
    return {
      stockId,
      status: "failed",
      error:
        "Aucun décideur identifié dans les sources publiques accessibles (essayez une saisie manuelle ou vérifiez le nom d’entreprise / le site).",
    };
  }

  const mergedPriority = inferDecisionMakerRolePriorityFromRoleText(merged.role);
  const existingPriority =
    (row.decision_maker_role_priority as LeadGenerationDecisionMakerRolePriority | null) ??
    inferDecisionMakerRolePriorityFromRoleText(row.decision_maker_role);
  const allowRoleUpgrade =
    roleFull &&
    Boolean(merged.role?.trim()) &&
    mergedPriority != null &&
    existingPriority != null &&
    decisionMakerRolePriorityRank(mergedPriority) < decisionMakerRolePriorityRank(existingPriority);

  let nextName: string | null = row.decision_maker_name ?? null;
  let nextRole: string | null = row.decision_maker_role ?? null;
  let nextSource: string | null = row.decision_maker_source ?? null;
  let nextConf: string | null = row.decision_maker_confidence ?? null;

  if (allowRoleUpgrade) {
    if (merged.name?.trim()) nextName = merged.name.trim();
    if (merged.role?.trim()) nextRole = merged.role.trim();
    nextSource = merged.source;
    nextConf = merged.confidence;
  } else {
    if (!nameFull && merged.name?.trim()) nextName = merged.name.trim();
    if (!roleFull && merged.role?.trim()) nextRole = merged.role.trim();
    if (!srcFull) nextSource = merged.source;
    if (!confFull) nextConf = merged.confidence;
  }

  const nextPriority = inferDecisionMakerRolePriorityFromRoleText(nextRole);

  const touched =
    (hasText(nextName) && nextName !== (row.decision_maker_name ?? null)) ||
    (hasText(nextRole) && nextRole !== (row.decision_maker_role ?? null)) ||
    (hasText(nextSource) && nextSource !== (row.decision_maker_source ?? null)) ||
    (hasText(nextConf) && nextConf !== (row.decision_maker_confidence ?? null)) ||
    (nextPriority != null && nextPriority !== (row.decision_maker_role_priority ?? null));

  if (!touched) {
    return {
      stockId,
      status: "completed",
      skipped: true,
      decision_maker_name: row.decision_maker_name,
      decision_maker_role: row.decision_maker_role,
      decision_maker_source: row.decision_maker_source,
      decision_maker_confidence: row.decision_maker_confidence,
    };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const patch: Record<string, unknown> = { updated_at: now };
  if (hasText(nextName) && nextName !== (row.decision_maker_name ?? null)) {
    patch.decision_maker_name = nextName!.trim();
  }
  if (hasText(nextRole) && nextRole !== (row.decision_maker_role ?? null)) {
    patch.decision_maker_role = nextRole!.trim();
  }
  if (hasText(nextSource) && nextSource !== (row.decision_maker_source ?? null)) {
    patch.decision_maker_source = nextSource;
  }
  if (hasText(nextConf) && nextConf !== (row.decision_maker_confidence ?? null)) {
    patch.decision_maker_confidence = nextConf;
  }
  if (nextPriority != null) {
    patch.decision_maker_role_priority = nextPriority;
  }

  const { error: upErr } = await stock.update(patch).eq("id", stockId);
  if (upErr) {
    return { stockId, status: "failed", error: upErr.message };
  }

  return {
    stockId,
    status: "completed",
    decision_maker_name: (patch.decision_maker_name as string | undefined) ?? row.decision_maker_name,
    decision_maker_role: (patch.decision_maker_role as string | undefined) ?? row.decision_maker_role,
    decision_maker_source: (patch.decision_maker_source as string | undefined) ?? row.decision_maker_source,
    decision_maker_confidence: (patch.decision_maker_confidence as string | undefined) ?? row.decision_maker_confidence,
  };
}
