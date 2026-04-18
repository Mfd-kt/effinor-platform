"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { getLeadGenerationSettingsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

export type GetLeadGenerationSettingsActionResult = Awaited<ReturnType<typeof getLeadGenerationSettings>>;

export async function getLeadGenerationSettingsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<GetLeadGenerationSettingsActionResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = getLeadGenerationSettingsActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: "Paramètres invalides." };
  }

  try {
    const data = await getLeadGenerationSettings();
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la lecture des réglages.";
    return { ok: false, error: message };
  }
}
