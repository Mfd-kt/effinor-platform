"use server";

import { createClient } from "@/lib/supabase/server";

import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import type { StartGoogleMapsApifyImportOk } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { startGoogleMapsApifyImportActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";

export async function startGoogleMapsApifyImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<StartGoogleMapsApifyImportOk>> {
  const parsed = startGoogleMapsApifyImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres d’import invalides." };
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
    const out = await startGoogleMapsApifyImport({
      ...parsed.data,
      ceeSheetId: cee.data.cee_sheet_id,
      ceeSheetCode: cee.data.cee_sheet_code,
      targetTeamId: cee.data.target_team_id,
    });
    if (!out.ok) {
      return {
        ok: false,
        error: out.batchId ? `${out.error} (batch ${out.batchId})` : out.error,
      };
    }
    return { ok: true, data: out.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du démarrage import Apify.";
    return { ok: false, error: message };
  }
}
