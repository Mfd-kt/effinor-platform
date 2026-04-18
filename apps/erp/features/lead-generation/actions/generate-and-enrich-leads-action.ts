"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { GenerateAndEnrichLeadsResult } from "../domain/main-actions-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import {
  buildGenerateCampaignPlan,
  parseCustomQueries,
  sectorNeedsCustomQueries,
} from "../lib/generate-campaign";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { enrichLeadGenerationStockQuick } from "../enrichment/enrich-lead-generation-stock";
import { generateAndEnrichLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import { runUnifiedLeadGenerationIngestThroughLinkedIn } from "../services/run-unified-lead-generation-ingest-through-linkedin";

export async function generateAndEnrichLeadsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<GenerateAndEnrichLeadsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = generateAndEnrichLeadsActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const data = parsed.data;
  if (sectorNeedsCustomQueries(data.sector) && parseCustomQueries(data.customQueriesText ?? "").length === 0) {
    return {
      ok: false,
      error:
        "Pour ce secteur, ajoutez au moins une requête personnalisée (une ligne = une recherche).",
    };
  }

  try {
    const plan = buildGenerateCampaignPlan({
      sector: data.sector,
      zone: data.zone,
      customQueriesText: data.customQueriesText ?? "",
      maxCrawledPlacesPerSearch: data.maxCrawledPlacesPerSearch,
      maxTotalPlaces: data.maxTotalPlaces,
    });

    if (plan.searchStrings.length === 0) {
      return {
        ok: false,
        error: "Veuillez configurer la recherche avant de lancer la génération.",
      };
    }

    const zone = data.zone.trim();
    const maxYp = data.maxYellowPagesResults ?? data.maxCrawledPlacesPerSearch ?? 50;

    const ingest = await runUnifiedLeadGenerationIngestThroughLinkedIn(
      {
        searchStrings: plan.searchStrings,
        maxCrawledPlacesPerSearch: plan.effectiveMaxPerSearch,
        includeWebResults: data.includeWebResults,
        locationQuery: zone.length > 0 ? zone : undefined,
        campaignName: data.campaignName.trim(),
        campaignSector: data.sector,
        maxYellowPagesResults: maxYp,
      },
      { persistPipelineRun: false },
    );

    if (!ingest.ok) {
      return { ok: false, error: humanizeLeadGenerationActionError(ingest.error) };
    }

    const premiumEnrich = ingest.yellowPatched + ingest.linkedInUpdated;

    if (ingest.stopped === "no_leads") {
      return {
        ok: true,
        data: {
          total_imported: 0,
          total_accepted: 0,
          total_enriched: 0,
          apify_run_started: true,
          sync_batches_scanned: 0,
          coordinator_batch_id: ingest.coordinatorBatchId,
          yellow_pages_patched: 0,
          linkedin_stocks_updated: 0,
          ingest_warnings: ingest.warnings.length ? ingest.warnings : undefined,
        },
      };
    }

    const { settings } = await getLeadGenerationSettings();
    const quickLimit = Math.min(100, Math.max(1, settings.mainActionsDefaults.post_import_enrich_limit));
    const quick = await enrichLeadGenerationStockQuick(quickLimit);

    return {
      ok: true,
      data: {
        total_imported: ingest.generatedAccepted,
        total_accepted: ingest.generatedAccepted,
        total_enriched: premiumEnrich + quick.successes,
        apify_run_started: true,
        sync_batches_scanned: 2,
        coordinator_batch_id: ingest.coordinatorBatchId,
        yellow_pages_patched: ingest.yellowPatched,
        linkedin_stocks_updated: ingest.linkedInUpdated,
        ingest_warnings: ingest.warnings.length ? ingest.warnings : undefined,
      },
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la génération / enrichissement.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
