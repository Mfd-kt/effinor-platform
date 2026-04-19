"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { applyDropcontactResultToLead } from "../dropcontact/apply-dropcontact-result";
import { fetchDropcontactEnrichmentResult } from "../dropcontact/client";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { recalculateLeadGenerationCommercialScore } from "../scoring/recalculate-lead-generation-commercial-score";
import { canUseDropcontactOnStock } from "./enrich-lead-generation-stock-dropcontact-action";

export type PullLeadGenerationDropcontactResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function revalidateLeadStock(id: string) {
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);
}

/**
 * Interroge Dropcontact (GET /v1/enrich/all/{request_id}) pour finaliser une fiche
 * restée en pending si le webhook n’est pas parvenu au serveur.
 */
export async function pullLeadGenerationDropcontactResultAction(
  stockId: string,
): Promise<PullLeadGenerationDropcontactResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const queue = canAccessLeadGenerationMyQueue(access);
  if (!hub && !queue) {
    return { ok: false, message: "Accès refusé." };
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

  if (!(await canUseDropcontactOnStock(access.userId, stock, hub))) {
    return { ok: false, message: "Cette fiche ne vous est pas attribuée." };
  }

  if (stock.dropcontact_status !== "pending") {
    return { ok: false, message: "Aucun enrichissement Dropcontact en attente sur cette fiche." };
  }

  const requestId = typeof stock.dropcontact_request_id === "string" ? stock.dropcontact_request_id.trim() : "";
  if (!requestId) {
    return {
      ok: false,
      message:
        "Identifiant Dropcontact absent : réinitialisez le suivi (pilotage) puis relancez l’enrichissement, ou attendez quelques secondes après le dernier clic.",
    };
  }

  const polled = await fetchDropcontactEnrichmentResult(requestId);

  if (polled.kind === "failed") {
    return { ok: false, message: polled.message };
  }

  if (polled.kind === "not_ready") {
    return {
      ok: false,
      message:
        "Dropcontact n’a pas encore terminé. Réessayez dans environ 30 secondes, ou vérifiez que le webhook serveur est bien configuré.",
    };
  }

  const contacts = polled.contacts;
  const now = new Date().toISOString();

  if (!contacts.length) {
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_status: "failed",
      enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", id);
    if (upErr) {
      return { ok: false, message: "Mise à jour impossible pour le moment." };
    }
    revalidateLeadStock(id);
    return { ok: true, message: "Réponse reçue : aucune donnée exploitable." };
  }

  const contact = contacts[0];
  if (!contact || typeof contact !== "object") {
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_status: "failed",
      enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", id);
    if (upErr) {
      return { ok: false, message: "Mise à jour impossible pour le moment." };
    }
    revalidateLeadStock(id);
    return { ok: true, message: "Réponse reçue : aucune donnée exploitable." };
  }

  const { patch, hasUsefulData } = applyDropcontactResultToLead(stock, contact as Record<string, unknown>);
  const { error: upErr } = await stockTable.update({ ...patch, updated_at: now }).eq("id", id);

  if (upErr) {
    await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: "Enrichissement interrompu. Réessayez plus tard.",
        enrichment_status: "failed",
        enrichment_error: "Enrichissement interrompu. Réessayez plus tard.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidateLeadStock(id);
    return { ok: false, message: "Mise à jour impossible pour le moment." };
  }

  if (hasUsefulData) {
    try {
      await recalculateLeadGenerationCommercialScore(id);
      await evaluateLeadGenerationDispatchQueue({ stockId: id });
    } catch {
      /* non bloquant */
    }
  }

  revalidateLeadStock(id);
  return {
    ok: true,
    message: hasUsefulData ? "Fiche mise à jour à partir de Dropcontact." : "Réponse reçue : peu de données utiles.",
  };
}
