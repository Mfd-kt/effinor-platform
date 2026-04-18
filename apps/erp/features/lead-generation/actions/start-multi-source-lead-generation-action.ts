"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { startMultiSourceLeadGenerationActionInputSchema } from "../schemas/lead-generation-actions.schema";
import type { RunMultiSourceLeadGenerationOk } from "../services/run-multi-source-lead-generation";
import { runMultiSourceLeadGeneration } from "../services/run-multi-source-lead-generation";

export async function startMultiSourceLeadGenerationAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RunMultiSourceLeadGenerationOk>> {
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
    const out = await runMultiSourceLeadGeneration(parsed.data);
    if (!out.ok) {
      return {
        ok: false,
        error: out.coordinatorBatchId ? `${out.error} (coordinateur ${out.coordinatorBatchId})` : out.error,
      };
    }
    return { ok: true, data: out.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du lancement multi-source.";
    return { ok: false, error: message };
  }
}
