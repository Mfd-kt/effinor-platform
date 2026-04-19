"use server";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { SimpleCreateLeadsMapsResult } from "../domain/main-actions-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import {
  buildGenerateCampaignPlan,
  parseCustomQueries,
  sectorNeedsCustomQueries,
} from "../lib/generate-campaign";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { generateAndEnrichLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";
import { executeUnifiedMapsPhase } from "../services/unified-pipeline-ingest-phases";

export async function simpleCreateLeadsMapsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<SimpleCreateLeadsMapsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
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

    const supabase = await createClient();
    const cee = await resolveLeadGenerationImportBatchCeeContext(supabase, data.ceeSheetId, data.targetTeamId);
    if (!cee.ok) {
      return { ok: false, error: cee.error };
    }

    const phase = await executeUnifiedMapsPhase({
      searchStrings: plan.searchStrings,
      maxCrawledPlacesPerSearch: plan.effectiveMaxPerSearch,
      includeWebResults: data.includeWebResults,
      locationQuery: zone.length > 0 ? zone : undefined,
      campaignName: data.campaignName.trim(),
      campaignSector: data.sector,
      ceeSheetId: cee.data.cee_sheet_id,
      ceeSheetCode: cee.data.cee_sheet_code,
      targetTeamId: cee.data.target_team_id,
    });

    return {
      ok: true,
      data: {
        acceptedCount: phase.acceptedCount,
        coordinatorBatchId: phase.coordinatorBatchId,
        mapsBatchId: phase.mapsBatchId,
      },
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la création des leads (carte).";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
