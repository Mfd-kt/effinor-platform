"use server";

import { revalidatePath } from "next/cache";

import { startLeboncoinImmobilierImport } from "@/features/lead-generation/apify/sources/leboncoin-immobilier/start-import";
import { leboncoinImmobilierInputSchema } from "@/features/lead-generation/apify/sources/leboncoin-immobilier/actor-input";
import { getAccessContext } from "@/lib/auth/access-context";

export type StartLeboncoinImmobilierImportActionResult =
  | { ok: true; batchId: string; externalRunId: string }
  | { ok: false; error: string };

/**
 * Server Action : lance un import Le Bon Coin Immobilier.
 * Appelée depuis la modale UI du quantifier.
 * Nécessite le rôle lead_generation_quantifier, admin ou super_admin.
 */
export async function startLeboncoinImmobilierImportAction(
  rawInput: unknown,
): Promise<StartLeboncoinImmobilierImportActionResult> {
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

  const parsed = leboncoinImmobilierInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Paramètres invalides : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  const result = await startLeboncoinImmobilierImport(parsed.data, {
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
