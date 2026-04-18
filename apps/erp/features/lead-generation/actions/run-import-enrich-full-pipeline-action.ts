"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { startMultiSourceLeadGenerationActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  runImportEnrichFullPipeline,
  type RunImportEnrichFullPipelineResult,
} from "../services/run-import-enrich-full-pipeline";

export async function runImportEnrichFullPipelineAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RunImportEnrichFullPipelineResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = startMultiSourceLeadGenerationActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await runImportEnrichFullPipeline(parsed.data);
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du parcours import / enrichissement.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
