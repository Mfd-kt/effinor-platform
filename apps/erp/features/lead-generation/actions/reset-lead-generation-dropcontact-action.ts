"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canBypassLeadGenMyQueueAsImpersonationActor,
} from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { logDropcontact } from "../dropcontact/dropcontact-log";
import { revalidateLeadStockDropcontactPaths } from "../dropcontact/revalidate-lead-stock-dropcontact-paths";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

export type ResetLeadGenerationDropcontactResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Remet le cycle Dropcontact à zéro (pilotage uniquement) pour débloquer une fiche
 * restée en « en cours » ou permettre un nouvel essai après erreur.
 */
export async function resetLeadGenerationDropcontactAction(
  stockId: string,
): Promise<ResetLeadGenerationDropcontactResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }
  const hub = await canAccessLeadGenerationHub(access);
  const impersonationSupport = canBypassLeadGenMyQueueAsImpersonationActor(access);
  if (!hub && !impersonationSupport) {
    return { ok: false, message: "Action réservée au pilotage (acquisition de leads) ou au support en impersonation." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error: loadErr } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (loadErr || !row) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = row as LeadGenerationStockRow;

  if (stock.converted_lead_id) {
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  const now = new Date().toISOString();
  const prev = stock.dropcontact_status ?? "idle";

  const patch: Record<string, unknown> = {
    dropcontact_status: "idle",
    dropcontact_request_id: null,
    dropcontact_requested_at: null,
    dropcontact_completed_at: null,
    dropcontact_last_error: null,
    dropcontact_raw_payload: null,
    updated_at: now,
  };

  if (prev === "pending" || prev === "failed") {
    patch.enrichment_status = "not_started";
    patch.enrichment_error = null;
  }

  const { error: upErr } = await stockTable.update(patch).eq("id", id);

  if (upErr) {
    logDropcontact("reset", "Reset Dropcontact : update refusée", { leadId: id, message: upErr.message });
    return { ok: false, message: "Réinitialisation impossible pour le moment." };
  }

  revalidateLeadStockDropcontactPaths(id, "reset_dropcontact");
  logDropcontact("reset", "Reset Dropcontact OK", { leadId: id, previousStatus: prev });

  return { ok: true, message: "Suivi Dropcontact réinitialisé. Vous pouvez relancer l’enrichissement." };
}
