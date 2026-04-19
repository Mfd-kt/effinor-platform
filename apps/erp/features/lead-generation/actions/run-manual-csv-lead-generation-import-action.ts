"use server";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { runManualCsvLeadGenerationImportActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  runManualCsvLeadGenerationImport,
  type ManualCsvLeadGenerationImportResult,
} from "../services/run-manual-csv-lead-generation-import";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";

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
    const supabase = await createClient();
    const cee = await resolveLeadGenerationImportBatchCeeContext(
      supabase,
      parsed.data.ceeSheetId,
      parsed.data.targetTeamId,
    );
    if (!cee.ok) {
      return { ok: false, error: cee.error };
    }
    const data = await runManualCsvLeadGenerationImport({
      csvText: parsed.data.csvText,
      filename: parsed.data.filename,
      sourceLabel: parsed.data.sourceLabel,
      cee: cee.data,
    });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’import CSV.";
    return { ok: false, error: message };
  }
}
