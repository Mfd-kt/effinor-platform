"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantification,
  canBypassLeadGenMyQueueAsImpersonationActor,
} from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { logDropcontact } from "../dropcontact/dropcontact-log";
import { revalidateLeadStockDropcontactPaths } from "../dropcontact/revalidate-lead-stock-dropcontact-paths";
import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";

export type ForceRefreshDropcontactUiResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Invalide le cache Next.js des pages lead-gen pour cette fiche (sans relire Dropcontact).
 * Utile si la base a changé mais que l’UI semble figée.
 */
export async function forceRefreshLeadGenerationDropcontactUiAction(
  stockId: string,
): Promise<ForceRefreshDropcontactUiResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const quantifier = canAccessLeadGenerationQuantification(access);
  const impersonationSupport = canBypassLeadGenMyQueueAsImpersonationActor(access);
  if (!hub && !quantifier && !impersonationSupport) {
    return { ok: false, message: "Action réservée au pilotage, au quantificateur ou au support (impersonation)." };
  }

  if (quantifier && !hub && !impersonationSupport) {
    const supabase = await createClient();
    const detail = await getLeadGenerationStockById(id);
    if (!detail) {
      return { ok: false, message: "Fiche introuvable." };
    }
    const gate = await assertQuantifierMayActOnQuantificationStock(supabase, access, detail.stock, detail.import_batch);
    if (!gate.ok) {
      return { ok: false, message: gate.message };
    }
  }

  revalidateLeadStockDropcontactPaths(id, "force_refresh_admin");
  logDropcontact("refresh_ui", "Action admin : revalidatePath forcé", { stockId: id });

  return {
    ok: true,
    message:
      "Caches Next.js revalidés pour cette fiche. Si l’affichage ne change pas après rafraîchissement navigateur : État DB mis à jour mais UI non rafraîchie — rechargez la page (F5) ou videz le cache.",
  };
}
