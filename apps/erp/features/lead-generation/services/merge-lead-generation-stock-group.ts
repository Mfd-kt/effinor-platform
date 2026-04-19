import type { SupabaseClient } from "@supabase/supabase-js";

import { lgTable } from "../lib/lg-db";

import { removeLeadGenerationStockAndTasks } from "./remove-lead-generation-stock-and-tasks";

/** Colonnes inchangées lors d’une fusion (identité métier / verrous). */
const MERGE_SKIP_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "import_batch_id",
  "source",
  "converted_lead_id",
  "current_assignment_id",
  "stock_status",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function preferRicherText(a: unknown, b: unknown): unknown {
  const ta = trimStr(a);
  const tb = trimStr(b);
  if (!ta) return tb || null;
  if (!tb) return ta || null;
  return ta.length >= tb.length ? ta : tb;
}

function maxInt(a: unknown, b: unknown, def = 0): number {
  const na = typeof a === "number" && !Number.isNaN(a) ? a : def;
  const nb = typeof b === "number" && !Number.isNaN(b) ? b : def;
  return Math.max(na, nb);
}

function orBool(a: unknown, b: unknown): boolean {
  return Boolean(a) || Boolean(b);
}

function betterFoundStatus(a: unknown, b: unknown): string {
  const sa = a === "found" || a === "missing" ? a : "missing";
  const sb = b === "found" || b === "missing" ? b : "missing";
  return sa === "found" || sb === "found" ? "found" : "missing";
}

const QUAL_ORDER = ["duplicate", "rejected", "pending", "qualified"] as const;

function betterQualification(a: unknown, b: unknown): string {
  const sa = typeof a === "string" ? a : "pending";
  const sb = typeof b === "string" ? b : "pending";
  const ia = QUAL_ORDER.indexOf(sa as (typeof QUAL_ORDER)[number]);
  const ib = QUAL_ORDER.indexOf(sb as (typeof QUAL_ORDER)[number]);
  const ca = ia === -1 ? 0 : ia;
  const cb = ib === -1 ? 0 : ib;
  return cb > ca ? sb : sa;
}

const TIER_RANK: Record<string, number> = { raw: 0, workable: 1, premium: 2 };

function betterTier(a: unknown, b: unknown): string {
  const sa = typeof a === "string" ? a : "raw";
  const sb = typeof b === "string" ? b : "raw";
  return (TIER_RANK[sb] ?? 0) > (TIER_RANK[sa] ?? 0) ? sb : sa;
}

function mergeJsonShallow(a: unknown, b: unknown): unknown {
  if (isRecord(a) && isRecord(b)) {
    return { ...a, ...b };
  }
  if (isRecord(b) && Object.keys(b).length > 0) return b;
  return a;
}

function unionStringArrayLike(a: unknown, b: unknown): unknown {
  const aa = Array.isArray(a) ? a.map(String) : [];
  const bb = Array.isArray(b) ? b.map(String) : [];
  return [...new Set([...aa, ...bb])];
}

function maxIsoDate(a: unknown, b: unknown): unknown {
  const sa = typeof a === "string" ? a : null;
  const sb = typeof b === "string" ? b : null;
  if (!sa) return sb;
  if (!sb) return sa;
  return new Date(sa).getTime() >= new Date(sb).getTime() ? sa : sb;
}

function foldMerge(base: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  const textKeys = [
    "company_name",
    "normalized_company_name",
    "phone",
    "normalized_phone",
    "email",
    "normalized_email",
    "website",
    "normalized_domain",
    "address",
    "postal_code",
    "city",
    "category",
    "sub_category",
    "siret",
    "headcount_range",
    "source_external_id",
    "rejection_reason",
    "enriched_email",
    "enriched_domain",
    "enriched_website",
    "enrichment_error",
    "manual_override_status",
    "manual_override_reason",
    "dispatch_queue_reason",
    "decision_maker_name",
    "decision_maker_role",
    "linkedin_url",
    "approach_angle",
    "approach_hook",
    "decision_maker_role_priority",
  ];
  for (const k of textKeys) {
    out[k] = preferRicherText(out[k], incoming[k]);
  }

  out.target_score = maxInt(out.target_score, incoming.target_score, 0);
  out.commercial_score = maxInt(out.commercial_score, incoming.commercial_score, 0);
  out.premium_score = maxInt(out.premium_score, incoming.premium_score, 0);
  out.source_signal_score = maxInt(out.source_signal_score, incoming.source_signal_score, 0);
  out.closing_readiness_score = maxInt(out.closing_readiness_score, incoming.closing_readiness_score, 0);
  out.duplicate_match_score = maxInt(out.duplicate_match_score, incoming.duplicate_match_score, 0);

  out.has_linkedin = orBool(out.has_linkedin, incoming.has_linkedin);
  out.has_decision_maker = orBool(out.has_decision_maker, incoming.has_decision_maker);

  out.phone_status = betterFoundStatus(out.phone_status, incoming.phone_status);
  out.email_status = betterFoundStatus(out.email_status, incoming.email_status);
  out.website_status = betterFoundStatus(out.website_status, incoming.website_status);

  out.qualification_status = betterQualification(out.qualification_status, incoming.qualification_status);

  out.lead_tier = betterTier(out.lead_tier, incoming.lead_tier);

  out.dispatch_queue_rank = maxInt(out.dispatch_queue_rank, incoming.dispatch_queue_rank, 0);

  out.raw_payload = mergeJsonShallow(out.raw_payload, incoming.raw_payload);
  out.commercial_score_breakdown = mergeJsonShallow(
    out.commercial_score_breakdown,
    incoming.commercial_score_breakdown,
  );
  out.enrichment_metadata = mergeJsonShallow(out.enrichment_metadata, incoming.enrichment_metadata);

  out.premium_reasons = unionStringArrayLike(out.premium_reasons, incoming.premium_reasons);
  out.closing_reasons = unionStringArrayLike(out.closing_reasons, incoming.closing_reasons);
  out.duplicate_match_reasons = unionStringArrayLike(out.duplicate_match_reasons, incoming.duplicate_match_reasons);
  out.source_channels = unionStringArrayLike(out.source_channels, incoming.source_channels);

  out.enriched_at = maxIsoDate(out.enriched_at, incoming.enriched_at);
  out.commercial_scored_at = maxIsoDate(out.commercial_scored_at, incoming.commercial_scored_at);
  out.premium_scored_at = maxIsoDate(out.premium_scored_at, incoming.premium_scored_at);
  out.closing_scored_at = maxIsoDate(out.closing_scored_at, incoming.closing_scored_at);
  out.manually_reviewed_at = maxIsoDate(out.manually_reviewed_at, incoming.manually_reviewed_at);
  out.dispatch_queue_evaluated_at = maxIsoDate(
    out.dispatch_queue_evaluated_at,
    incoming.dispatch_queue_evaluated_at,
  );
  out.imported_at = maxIsoDate(out.imported_at, incoming.imported_at);

  const fillIfEmptyKeys = [
    "enrichment_status",
    "enrichment_confidence",
    "enrichment_source",
    "decision_maker_source",
    "decision_maker_confidence",
    "dispatch_queue_status",
  ] as const;
  for (const k of fillIfEmptyKeys) {
    const cur = out[k];
    const inc = incoming[k];
    if ((cur === null || cur === undefined || cur === "") && inc !== null && inc !== undefined && inc !== "") {
      out[k] = inc;
    }
  }

  if (!out.manually_reviewed_by_user_id && incoming.manually_reviewed_by_user_id) {
    out.manually_reviewed_by_user_id = incoming.manually_reviewed_by_user_id;
  }

  return out;
}

function computeMergedRow(
  keeper: Record<string, unknown>,
  duplicates: Record<string, unknown>[],
): Record<string, unknown> {
  const sortedDups = [...duplicates].sort(
    (a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime(),
  );
  let acc: Record<string, unknown> = { ...keeper };
  for (const d of sortedDups) {
    acc = foldMerge(acc, d);
  }
  return acc;
}

function buildKeeperUpdatePatch(
  originalKeeper: Record<string, unknown>,
  merged: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (MERGE_SKIP_KEYS.has(key)) continue;
    const orig = originalKeeper[key];
    if (orig === value) continue;
    if (isRecord(value) && isRecord(orig)) {
      if (JSON.stringify(value) === JSON.stringify(orig)) continue;
    } else if (Array.isArray(value) && Array.isArray(orig)) {
      if (JSON.stringify(value) === JSON.stringify(orig)) continue;
    }
    patch[key] = value;
  }
  return patch;
}

/**
 * Choisit la fiche conservée (CRM / converti en priorité, sinon la plus ancienne) et les doublons à retirer.
 */
export function pickMergeKeeperAndDuplicates(
  rows: Record<string, unknown>[],
): { keeper: Record<string, unknown>; duplicates: Record<string, unknown>[] } | { skip: string } {
  if (rows.length < 2) return { skip: "groupe incomplet" };

  const leadIds = new Set(
    rows.map((r) => r.converted_lead_id as string | null).filter((id): id is string => Boolean(id)),
  );
  if (leadIds.size > 1) {
    return { skip: "plusieurs leads CRM distincts sur le même groupe" };
  }

  const sorted = [...rows].sort(
    (a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime(),
  );

  const withLead = sorted.filter((r) => r.converted_lead_id);
  let keeper: Record<string, unknown>;
  if (withLead.length > 0) {
    keeper = withLead[0];
  } else {
    const convertedNoLead = sorted.filter((r) => r.stock_status === "converted");
    keeper = convertedNoLead.length > 0 ? convertedNoLead[0] : sorted[0];
  }

  const duplicates = sorted.filter((r) => r.id !== keeper.id);
  return { keeper, duplicates };
}

export async function reassignLeadGenerationStockRelations(
  supabase: SupabaseClient,
  fromStockId: string,
  toStockId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (fromStockId === toStockId) return { ok: true };

  const { error: aErr } = await lgTable(supabase, "lead_generation_assignments")
    .update({ stock_id: toStockId })
    .eq("stock_id", fromStockId);
  if (aErr) return { ok: false, message: `assignments: ${aErr.message}` };

  const { error: actErr } = await lgTable(supabase, "lead_generation_assignment_activities")
    .update({ stock_id: toStockId })
    .eq("stock_id", fromStockId);
  if (actErr) return { ok: false, message: `activités: ${actErr.message}` };

  const { error: manErr } = await lgTable(supabase, "lead_generation_manual_reviews")
    .update({ stock_id: toStockId })
    .eq("stock_id", fromStockId);
  if (manErr) return { ok: false, message: `revues manuelles: ${manErr.message}` };

  const { error: leadErr } = await supabase
    .from("leads")
    .update({ lead_generation_stock_id: toStockId })
    .eq("lead_generation_stock_id", fromStockId);
  if (leadErr) return { ok: false, message: `leads: ${leadErr.message}` };

  const { error: dupRefErr } = await lgTable(supabase, "lead_generation_stock")
    .update({ duplicate_of_stock_id: toStockId })
    .eq("duplicate_of_stock_id", fromStockId)
    .neq("id", toStockId);
  if (dupRefErr) return { ok: false, message: `liens doublon: ${dupRefErr.message}` };

  const { error: taskErr } = await supabase
    .from("tasks")
    .update({ related_entity_id: toStockId })
    .eq("related_entity_type", "lead_generation_stock")
    .eq("related_entity_id", fromStockId);
  if (taskErr) return { ok: false, message: `tâches: ${taskErr.message}` };

  return { ok: true };
}

/**
 * Met à jour la fiche conservée avec les champs fusionnés, réaffecte les liens puis supprime les doublons.
 */
export async function mergeLeadGenerationStockDuplicateGroup(
  supabase: SupabaseClient,
  keeper: Record<string, unknown>,
  duplicates: Record<string, unknown>[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const keeperId = String(keeper.id);
  const merged = computeMergedRow(keeper, duplicates);
  const patch = buildKeeperUpdatePatch(keeper, merged);
  if (Object.keys(patch).length > 0) {
    const { error } = await lgTable(supabase, "lead_generation_stock").update(patch).eq("id", keeperId);
    if (error) return { ok: false, message: error.message };
  }

  for (const dup of duplicates) {
    const dupId = String(dup.id);
    const re = await reassignLeadGenerationStockRelations(supabase, dupId, keeperId);
    if (!re.ok) return re;
    const rm = await removeLeadGenerationStockAndTasks(supabase, dupId);
    if (!rm.ok) return { ok: false, message: rm.message };
  }
  return { ok: true };
}
