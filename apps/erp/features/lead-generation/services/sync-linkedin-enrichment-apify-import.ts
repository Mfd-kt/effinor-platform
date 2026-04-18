import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationSourceChannel } from "../domain/raw-input";
import { normalizeCompanyNameForMatching } from "../dedup/normalize-company-name-for-matching";
import { lgTable } from "../lib/lg-db";
import { combinedSourceSignalScore } from "../lib/multi-source-source-signal";
import {
  getApifyDatasetItems,
  getApifyRun,
  getApifyToken,
  isApifyRunFinished,
} from "../apify/client";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import type { SyncGoogleMapsApifyImportResult } from "../apify/types";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { inferDecisionMakerRolePriorityFromRoleText } from "../domain/decision-maker-role-priority";
import { mergeEnrichmentMetadata } from "../lib/merge-enrichment-metadata";
import {
  extractLinkedInProfileFromApifyItem,
  shouldApplyLinkedInDecisionMakerPatch,
} from "./apply-linkedin-profile-to-stock";

type EnrichmentTarget = {
  id: string;
  company_name: string;
  city: string | null;
  linkedin_candidate_reason?: string;
  /** Présent pour les runs « profile URLs » — appariement par URL plutôt que société + ville. */
  linkedin_url?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c.trim();
  }
  return null;
}

function normCity(c: string | null | undefined): string {
  if (c == null || !String(c).trim()) return "";
  return String(c)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function readTargets(metadata: unknown): EnrichmentTarget[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const le = (metadata as Record<string, unknown>).linkedInEnrichment;
  if (!le || typeof le !== "object") return [];
  const t = (le as Record<string, unknown>).targets;
  if (!Array.isArray(t)) return [];
  const out: EnrichmentTarget[] = [];
  for (const x of t) {
    if (!isRecord(x)) continue;
    const id = typeof x.id === "string" ? x.id : null;
    const company_name = typeof x.company_name === "string" ? x.company_name : null;
    if (!id || !company_name) continue;
    const city = typeof x.city === "string" ? x.city : null;
    const linkedin_candidate_reason =
      typeof x.linkedin_candidate_reason === "string" ? x.linkedin_candidate_reason : undefined;
    const linkedin_url =
      typeof x.linkedin_url === "string" && x.linkedin_url.trim() !== "" ? x.linkedin_url.trim() : null;
    out.push({ id, company_name, city, linkedin_candidate_reason, linkedin_url });
  }
  return out;
}

function normalizeLinkedInUrlForMatch(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return s
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "")
      .toLowerCase();
  }
}

function pickLinkedinUrl(item: Record<string, unknown>): string | null {
  return pickString(
    item.linkedinUrl,
    item.linkedInUrl,
    item.linkedinPublicUrl,
    item.linkedin,
    item.url,
    item.profileUrl,
    item.link,
    item.inputUrl,
    item.inputURL,
  );
}

function matchesTarget(
  item: Record<string, unknown>,
  companyPick: string | null,
  cityPick: string | null,
  t: EnrichmentTarget,
): boolean {
  const ic = companyPick ?? pickString(item.companyName, item.name, item.title, item.company);
  if (!ic) return false;
  const ici = cityPick ?? pickString(item.city, item.locality, item.location);
  const kn = normalizeCompanyNameForMatching(ic);
  const tn = normalizeCompanyNameForMatching(t.company_name);
  if (!kn || !tn || kn !== tn) return false;
  const tc = normCity(t.city);
  const icity = normCity(ici);
  if (tc && icity && tc !== icity) return false;
  return true;
}

function resolveTargetForLinkedInItem(
  item: Record<string, unknown>,
  targets: EnrichmentTarget[],
): EnrichmentTarget | undefined {
  const useUrl = targets.some((t) => t.linkedin_url?.trim());
  if (useUrl) {
    const url = pickLinkedinUrl(item);
    if (!url) return undefined;
    const n = normalizeLinkedInUrlForMatch(url);
    return targets.find(
      (t) => t.linkedin_url && normalizeLinkedInUrlForMatch(t.linkedin_url) === n,
    );
  }
  const co = pickString(item.companyName, item.name, item.title, item.company);
  const ci = pickString(item.city, item.locality, item.location);
  return targets.find((t) => matchesTarget(item, co, ci, t));
}

async function updateBatchFields(
  supabase: SupabaseClient,
  batchId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const batches = lgTable(supabase, "lead_generation_import_batches");
  await batches.update(patch as never).eq("id", batchId);
}

/**
 * Après run actor LinkedIn : met à jour les fiches cibles (URL + flags), sans ré-ingérer tout le stock.
 */
export async function syncLinkedInEnrichmentApifyImport(input: {
  batchId: string;
}): Promise<SyncGoogleMapsApifyImportResult> {
  const { batchId } = input;

  let token: string;
  try {
    token = getApifyToken();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration Apify invalide.";
    return { phase: "invalid_batch", batchId, message, error: message };
  }

  const row = await getLeadGenerationImportBatchById(batchId);
  if (!row) {
    return { phase: "invalid_batch", batchId, message: "Batch introuvable." };
  }
  if (row.source !== "apify_linkedin_enrichment") {
    return {
      phase: "invalid_batch",
      batchId,
      message: "Ce batch n’est pas un enrichissement LinkedIn.",
    };
  }

  if (row.status === "completed") {
    return {
      phase: "already_completed",
      batchId,
      apifyRunId: row.external_run_id ?? undefined,
      datasetId: row.external_dataset_id ?? undefined,
      externalStatus: row.external_status ?? "SUCCEEDED",
      fetchedCount: row.imported_count,
      ingestedCount: row.imported_count,
      acceptedCount: row.accepted_count,
      duplicateCount: row.duplicate_count,
      rejectedCount: row.rejected_count,
      message: "Enrichissement LinkedIn déjà appliqué.",
    };
  }

  if (row.status === "failed") {
    return {
      phase: "batch_failed",
      batchId,
      message: row.error_summary ?? "Batch en échec.",
      error: row.error_summary ?? undefined,
    };
  }

  const runId = row.external_run_id?.trim() || row.job_reference?.trim();
  if (!runId) {
    return { phase: "invalid_batch", batchId, message: "Batch sans run Apify." };
  }

  const targets = readTargets(row.metadata_json);
  if (targets.length === 0) {
    return { phase: "invalid_batch", batchId, message: "Batch sans cibles linkedInEnrichment." };
  }

  let run;
  try {
    run = await getApifyRun(token, runId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lecture run Apify.";
    return { phase: "failed", batchId, apifyRunId: runId, error: message, message };
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const datasetId = run.defaultDatasetId || row.external_dataset_id || "";
  await updateBatchFields(supabase, batchId, {
    external_status: run.status,
    external_dataset_id: datasetId || null,
  });

  const fin = isApifyRunFinished(run.status);
  if (fin === "running") {
    return {
      phase: "running",
      batchId,
      apifyRunId: runId,
      datasetId: datasetId || undefined,
      externalStatus: run.status,
      message: "Run LinkedIn en cours.",
    };
  }
  if (fin === "fail") {
    const finishedAt = new Date().toISOString();
    await updateBatchFields(supabase, batchId, {
      status: "failed",
      finished_at: finishedAt,
      external_status: run.status,
      error_summary: `Run LinkedIn en échec (${run.status}).`.slice(0, 2000),
    });
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      externalStatus: run.status,
      message: `Run LinkedIn en échec (${run.status}).`,
    };
  }

  if (!datasetId) {
    const msg = "Run LinkedIn sans dataset.";
    await updateBatchFields(supabase, batchId, {
      status: "failed",
      finished_at: new Date().toISOString(),
      error_summary: msg,
    });
    return { phase: "failed", batchId, apifyRunId: runId, message: msg, error: msg };
  }

  const now = new Date().toISOString();
  const { data: claimRows, error: claimErr } = await batches
    .update({ ingest_started_at: now } as never)
    .eq("id", batchId)
    .eq("status", "running")
    .is("ingest_started_at", null)
    .select("id");

  if (claimErr) {
    return { phase: "failed", batchId, apifyRunId: runId, error: claimErr.message, message: claimErr.message };
  }
  if (!claimRows?.length) {
    return { phase: "ingesting_elsewhere", batchId, apifyRunId: runId, message: "Traitement déjà en cours." };
  }

  const items = await getApifyDatasetItems(token, datasetId);
  console.info("[apify] LinkedIn sync — dataset", { batchId, datasetId, itemCount: items.length, runStatus: run.status });
  const stock = lgTable(supabase, "lead_generation_stock");
  let updated = 0;

  for (const raw of items) {
    if (!isRecord(raw)) continue;
    if (raw.succeeded === false) continue;
    const url = pickLinkedinUrl(raw);
    if (!url || !url.includes("linkedin.")) continue;
    const t = resolveTargetForLinkedInItem(raw, targets);
    if (!t) continue;

    const { data: cur, error: readErr } = await stock.select("*").eq("id", t.id).maybeSingle();
    if (readErr || !cur) continue;

    const row = cur as LeadGenerationStockRow;
    const prevCh = (row.source_channels ?? []) as LeadGenerationSourceChannel[];
    const nextCh = [...new Set([...prevCh, "linkedin" as const])] as LeadGenerationSourceChannel[];
    const score = combinedSourceSignalScore(nextCh);
    const prevTarget = row.target_score ?? 0;
    const nowIso = new Date().toISOString();
    const prof = extractLinkedInProfileFromApifyItem(raw);

    const metaPatch: Record<string, unknown> = {
      linkedin_synced_at: nowIso,
      linkedin_batch_id: batchId,
    };
    if (t.linkedin_candidate_reason) {
      metaPatch.linkedin_candidate_reason = t.linkedin_candidate_reason;
    }

    const patch: Record<string, unknown> = {
      linkedin_url: url,
      has_linkedin: true,
      source_channels: nextCh,
      source_signal_score: score,
      target_score: Math.max(prevTarget, score),
      enrichment_metadata: mergeEnrichmentMetadata(row.enrichment_metadata, metaPatch),
      updated_at: nowIso,
    };

    if (
      shouldApplyLinkedInDecisionMakerPatch({
        row,
        proposedName: prof.name,
        proposedRole: prof.role,
      })
    ) {
      if (prof.name?.trim()) {
        patch.decision_maker_name = prof.name.trim();
        patch.has_decision_maker = true;
      }
      if (prof.role?.trim()) {
        patch.decision_maker_role = prof.role.trim();
        const rp = inferDecisionMakerRolePriorityFromRoleText(prof.role);
        if (rp) patch.decision_maker_role_priority = rp;
      }
      patch.decision_maker_source = "linkedin";
      patch.decision_maker_confidence = "high";
    }

    const emailFromActor = pickString(raw.email, raw.workEmail, raw.personalEmail);
    if (
      emailFromActor &&
      !row.email?.trim() &&
      !row.enriched_email?.trim()
    ) {
      patch.enriched_email = emailFromActor;
      patch.email_status = "found";
    }

    await stock.update(patch as never).eq("id", t.id);
    updated += 1;
  }

  const finishedAt = new Date().toISOString();
  await updateBatchFields(supabase, batchId, {
    status: "completed",
    finished_at: finishedAt,
    external_status: run.status,
    imported_count: items.length,
    accepted_count: updated,
    duplicate_count: 0,
    rejected_count: 0,
    metadata_json: {
      ...(typeof row.metadata_json === "object" && row.metadata_json !== null && !Array.isArray(row.metadata_json)
        ? (row.metadata_json as Record<string, unknown>)
        : {}),
      linkedInEnrichment: {
        ...((row.metadata_json as Record<string, unknown>)?.linkedInEnrichment as object),
        appliedAt: finishedAt,
        stocksUpdated: updated,
      },
    } as unknown as Json,
  });

  return {
    phase: "completed",
    batchId,
    apifyRunId: runId,
    datasetId,
    externalStatus: run.status,
    fetchedCount: items.length,
    ingestedCount: items.length,
    acceptedCount: updated,
    duplicateCount: 0,
    rejectedCount: 0,
    message: `LinkedIn : ${updated} fiche(s) mise(s) à jour.`,
  };
}
