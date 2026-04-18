"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { runManualCsvLeadGenerationImportActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  runManualCsvLeadGenerationImport,
  type ManualCsvLeadGenerationImportResult,
} from "../services/run-manual-csv-lead-generation-import";

export async function runManualCsvLeadGenerationImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<ManualCsvLeadGenerationImportResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = runManualCsvLeadGenerationImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await runManualCsvLeadGenerationImport(parsed.data);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’import CSV.";
    return { ok: false, error: message };
  }
}
