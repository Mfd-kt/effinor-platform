"use server";

import { getAccessContext } from "@/lib/auth/access-context";

import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { canAccessLeadGenerationImportBatchAsUser } from "../lib/lead-generation-import-batch-access";
import type { SyncGoogleMapsApifyImportResult } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { syncGoogleMapsApifyImportActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function syncGoogleMapsApifyImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<SyncGoogleMapsApifyImportResult>> {
  const parsed = syncGoogleMapsApifyImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant batch invalide." };
  }

  try {
    const access = await getAccessContext();
    if (access.kind !== "authenticated") {
      return { ok: false, error: "Non authentifié." };
    }

    const batchId = parsed.data.batchId;
    const row = await getLeadGenerationImportBatchById(batchId);
    if (!row) {
      return { ok: false, error: "Batch introuvable." };
    }

    if (!(await canAccessLeadGenerationImportBatchAsUser(access, row))) {
      return { ok: false, error: "Accès refusé." };
    }

    if (row.source === "apify_yellow_pages" || row.source === "apify_multi_source") {
      return {
        ok: false,
        error:
          "Ce type d’import (Pages Jaunes ou lot multi-source) n’est plus pris en charge. Créez un nouvel import Google Maps.",
      };
    }

    const data = await syncGoogleMapsApifyImport(parsed.data);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la synchronisation import Apify.";
    return { ok: false, error: message };
  }
}
