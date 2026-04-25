"use server";

import { revalidatePath } from "next/cache";

import { papActorInputSchema } from "@/features/lead-generation/apify/sources/pap/actor-input";
import { startPapImport } from "@/features/lead-generation/apify/sources/pap/start-import";
import { getAccessContext } from "@/lib/auth/access-context";

export type StartPapImportActionResult =
  | { ok: true; batchId: string; externalRunId: string }
  | { ok: false; error: string };

/**
 * Server Action : lance un import PAP.fr.
 * Appelée depuis la modale UI du quantifier.
 * Nécessite le rôle lead_generation_quantifier, admin ou super_admin.
 */
export async function startPapImportAction(
  rawInput: unknown,
): Promise<StartPapImportActionResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  const roleCodes = access.roleCodes ?? [];
  const isAuthorized =
    roleCodes.includes("lead_generation_quantifier") ||
    roleCodes.includes("admin") ||
    roleCodes.includes("super_admin");

  if (!isAuthorized) {
    return {
      ok: false,
      error: "Rôle insuffisant : seuls les quantifiers et admins peuvent lancer un import.",
    };
  }

  const parsed = papActorInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Paramètres invalides : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  const result = await startPapImport(parsed.data, {
    userId: access.userId,
    ceeSheetId: null,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/imports");

  return {
    ok: true,
    batchId: result.batchId,
    externalRunId: result.externalRunId,
  };
}
