"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import type { StartLinkedInEnrichmentOk } from "../services/start-linkedin-enrichment-apify-import";
import { startLinkedInEnrichmentApifyImport } from "../services/start-linkedin-enrichment-apify-import";

export async function startLinkedInEnrichmentApifyImportAction(): Promise<
  LeadGenerationActionResult<StartLinkedInEnrichmentOk>
> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  try {
    const out = await startLinkedInEnrichmentApifyImport();
    if (!out.ok) {
      return { ok: false, error: out.error };
    }
    return { ok: true, data: out.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du lancement LinkedIn.";
    return { ok: false, error: message };
  }
}
