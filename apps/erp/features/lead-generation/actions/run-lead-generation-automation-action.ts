"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import { runLeadGenerationAutomation } from "../automation/run-lead-generation-automation";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { runLeadGenerationAutomationActionInputSchema } from "../schemas/lead-generation-actions.schema";
import type { RunLeadGenerationAutomationResult } from "../automation/run-lead-generation-automation";

export async function runLeadGenerationAutomationAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RunLeadGenerationAutomationResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = runLeadGenerationAutomationActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await runLeadGenerationAutomation({
      automationType: parsed.data.automationType,
      triggeredByUserId: access.userId,
    });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’automatisation.";
    return { ok: false, error: message };
  }
}
