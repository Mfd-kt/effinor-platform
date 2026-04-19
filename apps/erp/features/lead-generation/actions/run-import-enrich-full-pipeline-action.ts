"use server";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { startGoogleMapsApifyImportActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";
import {
  runImportEnrichFullPipeline,
  type RunImportEnrichFullPipelineResult,
} from "../services/run-import-enrich-full-pipeline";

export async function runImportEnrichFullPipelineAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RunImportEnrichFullPipelineResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = startGoogleMapsApifyImportActionInputSchema.safeParse(input);
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
    const data = await runImportEnrichFullPipeline({
      ...parsed.data,
      ceeSheetId: cee.data.cee_sheet_id,
      ceeSheetCode: cee.data.cee_sheet_code,
      targetTeamId: cee.data.target_team_id,
    });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du parcours import / enrichissement.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
