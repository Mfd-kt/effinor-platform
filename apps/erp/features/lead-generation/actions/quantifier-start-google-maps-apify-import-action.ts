"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import type { StartGoogleMapsApifyImportOk } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { parseGoogleMapsSearchLines } from "../lib/parse-google-maps-search-lines";
import { quantifierStartGoogleMapsApifyImportActionInputSchema } from "../schemas/quantifier-google-maps-import.schema";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";

export async function quantifierStartGoogleMapsApifyImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<StartGoogleMapsApifyImportOk>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationQuantification(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = quantifierStartGoogleMapsApifyImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const supabase = await createClient();
    const cee = await resolveLeadGenerationImportBatchCeeContext(
      supabase,
      parsed.data.ceeSheetId,
      parsed.data.targetTeamId,
    );
    if (!cee.ok) {
      return { ok: false, error: cee.error };
    }

    const searchStrings = parseGoogleMapsSearchLines(parsed.data.searchLines);
    const campaignName = searchStrings[0] ?? "Import Maps";

    const out = await startGoogleMapsApifyImport({
      searchStrings,
      locationQuery: parsed.data.locationQuery?.trim() || undefined,
      maxCrawledPlacesPerSearch: parsed.data.maxCrawledPlacesPerSearch,
      ceeSheetId: cee.data.cee_sheet_id,
      ceeSheetCode: cee.data.cee_sheet_code,
      targetTeamId: cee.data.target_team_id,
      campaignName,
      createdByUserId: access.userId,
      stockInitialQualification: "to_validate",
    });

    if (!out.ok) {
      return {
        ok: false,
        error: out.batchId ? `${out.error} (batch ${out.batchId})` : out.error,
      };
    }

    revalidatePath("/lead-generation/quantification");
    revalidatePath("/lead-generation/imports");

    return { ok: true, data: out.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du démarrage de l’import.";
    return { ok: false, error: message };
  }
}
