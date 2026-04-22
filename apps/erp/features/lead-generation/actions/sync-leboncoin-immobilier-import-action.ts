"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncLeboncoinImmobilierImport } from "@/features/lead-generation/apify/sources/leboncoin-immobilier/sync-import";
import { getAccessContext } from "@/lib/auth/access-context";

const inputSchema = z.object({
  batchId: z.string().uuid(),
});

export type SyncLeboncoinImmobilierImportActionResult =
  | {
      ok: true;
      status: "running" | "completed" | "failed";
      insertedCount: number;
      duplicateCount: number;
      totalFetched: number;
      phoneQuotaExhausted: boolean;
    }
  | { ok: false; error: string };

/**
 * Server Action : synchronise un batch Le Bon Coin (récupère les résultats Apify
 * et les insère dans lead_generation_stock).
 * Peut être appelée manuellement (bouton "Actualiser") ou par le cron.
 */
export async function syncLeboncoinImmobilierImportAction(
  rawInput: unknown,
): Promise<SyncLeboncoinImmobilierImportActionResult> {
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
    return { ok: false, error: "Rôle insuffisant" };
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: `batchId invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  const result = await syncLeboncoinImmobilierImport(parsed.data.batchId);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/imports");
  revalidatePath("/lead-generation/stock");

  return {
    ok: true,
    status: result.status,
    insertedCount: result.insertedCount,
    duplicateCount: result.duplicateCount,
    totalFetched: result.totalFetched,
    phoneQuotaExhausted: result.phoneQuotaExhausted,
  };
}
