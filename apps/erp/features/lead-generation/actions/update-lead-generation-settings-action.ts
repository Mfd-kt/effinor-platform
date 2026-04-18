"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { updateLeadGenerationSettingsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { updateLeadGenerationSettings } from "../settings/update-lead-generation-settings";

export async function updateLeadGenerationSettingsAction(
  input: unknown,
): Promise<
  LeadGenerationActionResult<{
    key: string;
    value: unknown;
    updatedAt: string;
    updatedByUserId: string | null;
  }>
> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = updateLeadGenerationSettingsActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const row = await updateLeadGenerationSettings({
      key: parsed.data.key,
      value: parsed.data.value,
      updatedByUserId: access.userId,
    });
    return {
      ok: true,
      data: {
        key: row.key,
        value: row.value,
        updatedAt: row.updated_at,
        updatedByUserId: row.updated_by_user_id,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la mise à jour des réglages.";
    return { ok: false, error: message };
  }
}
