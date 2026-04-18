import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { lgTable } from "../lib/lg-db";
import {
  buildLinkedInEnrichmentApifyProxyConfiguration,
  getApifyToken,
  getLinkedInEnrichmentActorId,
  resolveLinkedInEnrichmentApifyInputProfile,
  startApifyActorRun,
} from "../apify/client";
import { getLeadGenerationStockForLinkedInEnrichment } from "../queries/get-lead-generation-stock-for-linkedin-enrichment";

async function markFailed(
  supabase: SupabaseClient,
  batchId: string,
  metadata: Record<string, unknown>,
  errorSummary: string,
): Promise<void> {
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const finishedAt = new Date().toISOString();
  await batches
    .update({
      status: "failed",
      finished_at: finishedAt,
      error_summary: errorSummary.slice(0, 2000),
      metadata_json: { ...metadata, error: errorSummary } as unknown as Json,
    } as never)
    .eq("id", batchId);
}

export type StartLinkedInEnrichmentOk = {
  batchId: string;
  apifyRunId: string;
  datasetId: string;
  targetCount: number;
};

function parseLinkedInMaxEmployees(): number {
  const raw = process.env.LINKEDIN_ENRICH_MAX_EMPLOYEES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 20;
  if (!Number.isFinite(n)) return 20;
  return Math.min(1000, Math.max(1, n));
}

/** Sans ville dans l’input Apify : uniquement le nom (ou city vide) — comme « Locations Filter » vide sur la console = cible large. */
function linkedInActorInputOpenScope(): boolean {
  const v = process.env.LINKEDIN_ENRICH_ACTOR_OPEN_SCOPE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** JSON array optionnel (ex. [] ou ["France"]) pour les actors type HarvestAPI ; absent = ne pas envoyer la clé. */
function parseLinkedInLocationsFilterJson(): unknown[] | undefined {
  const raw = process.env.APIFY_LINKEDIN_LOCATIONS_FILTER_JSON?.trim();
  if (!raw) return undefined;
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function applyLinkedInRunInputExtras(runInput: Record<string, unknown>): void {
  const loc = parseLinkedInLocationsFilterJson();
  if (loc !== undefined) {
    runInput.locationsFilter = loc;
  }
}

/**
 * Lance un run Apify unique pour un petit lot de fiches à fort potentiel (score signal ou commercial).
 * Input : `companies`, `targets` + proxy, ou `profileUrls` selon l’actor — voir `resolveLinkedInEnrichmentApifyInputProfile`.
 */
export async function startLinkedInEnrichmentApifyImport(input?: {
  importBatchId?: string | null;
}): Promise<
  | { ok: true; data: StartLinkedInEnrichmentOk }
  | { ok: false; error: string; skipped?: boolean }
> {
  const actorId = getLinkedInEnrichmentActorId();
  if (!actorId) {
    return {
      ok: false,
      skipped: true,
      error: "Enrichissement LinkedIn désactivé : définissez APIFY_LINKEDIN_ENRICHMENT_ACTOR_ID.",
    };
  }

  const inputProfile = resolveLinkedInEnrichmentApifyInputProfile(actorId);

  let targets;
  try {
    targets = await getLeadGenerationStockForLinkedInEnrichment({
      importBatchId: input?.importBatchId,
      requireLinkedInUrl: inputProfile === "profile_urls",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lecture stock impossible.";
    return { ok: false, error: msg };
  }

  if (targets.length === 0) {
    return {
      ok: false,
      skipped: true,
      error:
        inputProfile === "profile_urls"
          ? "Aucune fiche éligible avec une URL LinkedIn renseignée (requis pour cet actor — renseignez linkedin_url ou utilisez un actor entreprise companies/targets)."
          : "Aucune fiche éligible (scores insuffisants ou déjà enrichie LinkedIn).",
    };
  }

  if (inputProfile === "profile_urls") {
    const urls = targets
      .map((t) => t.linkedin_url?.trim())
      .filter((u): u is string => !!u && u.includes("linkedin"));
    if (urls.length === 0) {
      return {
        ok: false,
        skipped: true,
        error:
          "Aucune URL LinkedIn exploitable pour l’actor profils (linkedin_url manquant ou invalide sur les fiches sélectionnées).",
      };
    }
  }

  let token: string;
  try {
    token = getApifyToken();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Token Apify manquant.";
    return { ok: false, error: message };
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const now = new Date().toISOString();

  const baseMetadata: Record<string, unknown> = {
    linkedInEnrichment: {
      inputProfile,
      targets: targets.map((t) => ({
        id: t.id,
        company_name: t.company_name,
        city: t.city,
        linkedin_url: t.linkedin_url,
        linkedin_candidate_reason: t.linkedin_candidate_reason,
      })),
    },
  };

  const { data: inserted, error: insErr } = await batches
    .insert({
      source: "apify_linkedin_enrichment",
      source_label: `LinkedIn · ${targets.length} fiche(s)`,
      status: "running",
      started_at: now,
      metadata_json: baseMetadata as unknown as Json,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    return { ok: false, error: insErr?.message ?? "Création batch LinkedIn impossible." };
  }

  const batchId = (inserted as { id: string }).id;

  try {
    const openScope = linkedInActorInputOpenScope();
    const runInput: Record<string, unknown> =
      inputProfile === "profile_urls"
        ? {
            profileUrls: targets
              .map((t) => t.linkedin_url?.trim())
              .filter((u): u is string => !!u && u.includes("linkedin")),
          }
        : inputProfile === "targets"
          ? {
              targets: targets
                .map((t) => {
                  const name = t.company_name?.trim() ?? "";
                  if (openScope) return name;
                  const city = t.city?.trim();
                  return city ? `${name} ${city}`.trim() : name;
                })
                .filter((s) => s.length > 0),
              maxEmployees: parseLinkedInMaxEmployees(),
              proxyConfiguration: buildLinkedInEnrichmentApifyProxyConfiguration(),
            }
          : {
              companies: targets.map((t) => ({
                name: t.company_name,
                city: openScope ? "" : (t.city ?? ""),
              })),
            };

    applyLinkedInRunInputExtras(runInput);

    const started = await startApifyActorRun(token, actorId, runInput);
    const apifyRunId = started.id;
    const datasetId = started.defaultDatasetId ?? "";

    await batches
      .update({
        job_reference: apifyRunId,
        external_run_id: apifyRunId,
        external_dataset_id: datasetId || null,
        external_status: started.status ?? "",
        metadata_json: { ...baseMetadata, apifyRunId } as unknown as Json,
      } as never)
      .eq("id", batchId);

    return {
      ok: true,
      data: {
        batchId,
        apifyRunId,
        datasetId,
        targetCount: targets.length,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec démarrage actor LinkedIn.";
    await markFailed(supabase, batchId, baseMetadata, message);
    return { ok: false, error: message };
  }
}
