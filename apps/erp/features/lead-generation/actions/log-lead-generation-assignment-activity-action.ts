"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { logLeadGenerationAssignmentActivityActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  logLeadGenerationAssignmentActivity,
  type LeadGenerationAssignmentActivityRow,
} from "../services/log-lead-generation-assignment-activity";

function parseOptionalNextActionAt(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

export async function logLeadGenerationAssignmentActivityAction(
  input: unknown,
): Promise<LeadGenerationActionResult<{ activity: LeadGenerationAssignmentActivityRow }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Authentification requise." };
  }

  const parsed = logLeadGenerationAssignmentActivityActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const { nextActionAt, ...rest } = parsed.data;
  const nextActionAtIso = parseOptionalNextActionAt(nextActionAt);

  try {
    const data = await logLeadGenerationAssignmentActivity({
      ...rest,
      nextActionAt: nextActionAtIso,
      actorUserId: access.userId,
      allowAsAdmin: canAccessAdminCeeSheets(access),
    });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’enregistrement.";
    return { ok: false, error: message };
  }
}
