"use server";

import { revalidatePath } from "next/cache";

import { computeResult } from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";
import { submitSimulationSchema } from "@/features/simulator-cee/schemas/simulation.schema";
import { saveSimulationForLead } from "@/features/simulator-cee/services/save-simulation-for-lead";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasRole, isCloser, isSalesAgent } from "@/lib/auth/role-codes";

export type SaveSimulationForLeadResult =
  | { ok: true; leadId: string; simulationId: string }
  | { ok: false; error: string };

export async function saveSimulationForLeadAction(
  leadId: string,
  raw: unknown,
  options: { savedDespiteNonEligible?: boolean } = {}
): Promise<SaveSimulationForLeadResult> {
  const ctx = await getAccessContext();
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }
  const allowed =
    isSalesAgent(ctx.roleCodes) ||
    isCloser(ctx.roleCodes) ||
    hasRole(ctx.roleCodes, "admin", "super_admin");
  if (!allowed) {
    return { ok: false, error: "Accès refusé" };
  }
  if (!leadId || typeof leadId !== "string") {
    return { ok: false, error: "Identifiant de lead manquant" };
  }

  const parsed = submitSimulationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides" };
  }

  const answers = parsed.data as unknown as SimulationAnswers;
  const result = computeResult(answers);
  const eligible = result.pac.eligible || result.renov.eligible;
  const savedDespite = options.savedDespiteNonEligible === true;

  if (!eligible && !savedDespite) {
    return {
      ok: false,
      error:
        "Prospect non éligible — utilisez « Enregistrer quand même » pour forcer l'enregistrement.",
    };
  }
  if (parsed.data.profil === "locataire" && !savedDespite) {
    return {
      ok: false,
      error: "Profil locataire : enregistrement nécessite l'override agent.",
    };
  }

  try {
    const { simulationId } = await saveSimulationForLead({
      userId: ctx.userId,
      leadId,
      answers: parsed.data,
      savedDespiteNonEligible: savedDespite,
    });
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, leadId, simulationId };
  } catch (e) {
    console.error("saveSimulationForLeadAction", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors de l'enregistrement",
    };
  }
}
