"use server";

import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import type { StartGoogleMapsApifyImportOk } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { startGoogleMapsApifyImportActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function startGoogleMapsApifyImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<StartGoogleMapsApifyImportOk>> {
  const parsed = startGoogleMapsApifyImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres d’import invalides." };
  }

  try {
    const out = await startGoogleMapsApifyImport(parsed.data);
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
