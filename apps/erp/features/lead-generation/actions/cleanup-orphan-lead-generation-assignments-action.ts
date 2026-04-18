"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { cleanupOrphanLeadGenerationAssignmentsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { repairOrphanLeadGenerationAssignments } from "../services/repair-orphan-lead-generation-assignments";

export async function cleanupOrphanLeadGenerationAssignmentsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<Awaited<ReturnType<typeof repairOrphanLeadGenerationAssignments>>>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = cleanupOrphanLeadGenerationAssignmentsActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await repairOrphanLeadGenerationAssignments({ limit: parsed.data.limit ?? 200 });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du nettoyage des assignations orphelines.";
    return { ok: false, error: message };
  }
}
