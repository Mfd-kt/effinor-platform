"use server";

import { revalidatePath } from "next/cache";

import { computeResult } from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";
import { submitSimulationSchema } from "@/features/simulator-cee/schemas/simulation.schema";
import { createSimulation } from "@/features/simulator-cee/services/create-simulation";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasRole, isCloser, isSalesAgent } from "@/lib/auth/role-codes";

export type SubmitSimulationActionResult =
  | { ok: true; leadId: string; simulationId: string }
  | { ok: false; error: string };

export type SubmitSimulationOptions = {
  /**
   * `savedDespiteNonEligible` — autorise la création d’un lead même si la
   * simulation est non éligible (override agent pour suivi commercial).
   */
  savedDespiteNonEligible?: boolean;
};

export async function submitSimulationAction(
  raw: unknown,
  options: SubmitSimulationOptions = {},
): Promise<SubmitSimulationActionResult> {
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
      error: "Prospect non éligible — utilisez « Enregistrer quand même » pour forcer la création.",
    };
  }

  // Locataire = toujours non éligible côté domain → autorisé seulement via override.
  if (parsed.data.profil === "locataire" && !savedDespite) {
    return { ok: false, error: "Profil locataire : création de lead nécessite l’override agent." };
  }

  try {
    const { leadId, simulationId } = await createSimulation({
      userId: ctx.userId,
      answers: parsed.data,
      savedDespiteNonEligible: savedDespite,
    });
    revalidatePath("/simulateur");
    revalidatePath("/leads");
    return { ok: true, leadId, simulationId };
  } catch (e) {
    console.error("submitSimulationAction", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors de la création du lead",
    };
  }
}
