"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { finalizeDropcontactFromGetContacts } from "../dropcontact/finalize-dropcontact-from-get-contacts";
import { fetchDropcontactEnrichmentResult } from "../dropcontact/client";
import { logDropcontact } from "../dropcontact/dropcontact-log";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { canUseDropcontactOnStock } from "./enrich-lead-generation-stock-dropcontact-action";

export type PullLeadGenerationDropcontactResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Un seul GET sur le request_id déjà stocké (relance manuelle si le polling initial a expiré).
 */
export async function pullLeadGenerationDropcontactResultAction(
  stockId: string,
): Promise<PullLeadGenerationDropcontactResult> {
  const id = stockId?.trim();
  if (!id) {
    logDropcontact("pull", "Abandon : fiche invalide");
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    logDropcontact("pull", "Abandon : non authentifié", { leadId: id });
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const queue = canAccessLeadGenerationMyQueue(access);
  if (!hub && !queue) {
    logDropcontact("pull", "Abandon : accès refusé", { leadId: id });
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error: loadErr } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (loadErr || !row) {
    logDropcontact("pull", "Fiche introuvable", { leadId: id, loadError: loadErr?.message });
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = row as LeadGenerationStockRow;

  if (stock.converted_lead_id) {
    logDropcontact("pull", "Abandon : convertie", { leadId: id });
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (!(await canUseDropcontactOnStock(access.userId, stock, hub))) {
    logDropcontact("pull", "Abandon : non attribuée", { leadId: id });
    return { ok: false, message: "Cette fiche ne vous est pas attribuée." };
  }

  if (stock.dropcontact_status !== "pending") {
    logDropcontact("pull", "Abandon : pas en pending", { leadId: id, status: stock.dropcontact_status });
    return { ok: false, message: "Aucun enrichissement Dropcontact en attente sur cette fiche." };
  }

  const requestId = typeof stock.dropcontact_request_id === "string" ? stock.dropcontact_request_id.trim() : "";
  if (!requestId) {
    logDropcontact("pull", "Abandon : request_id absent en base", {
      leadId: id,
      dropcontact_status: stock.dropcontact_status,
    });
    return {
      ok: false,
      message:
        "Identifiant Dropcontact absent en base : réinitialisez le suivi (pilotage) puis relancez l’enrichissement.",
    };
  }

  logDropcontact("pull", "GET manuel (récupérer le résultat)", {
    leadId: id,
    requestId,
    dbBefore: {
      dropcontact_status: stock.dropcontact_status,
      enrichment_status: stock.enrichment_status,
    },
  });

  const polled = await fetchDropcontactEnrichmentResult(requestId);

  if (polled.kind === "failed") {
    logDropcontact("pull", "GET Dropcontact échec", {
      leadId: id,
      requestId,
      code: polled.code,
      message: polled.message,
      httpStatus: polled.httpStatus,
    });
    return { ok: false, message: polled.message };
  }

  if (polled.kind === "not_ready") {
    logDropcontact("pull", "GET not_ready (manuel)", {
      leadId: id,
      requestId,
      reason: polled.reason,
    });
    return {
      ok: false,
      message: "Résultat pas encore prêt, réessayez dans quelques instants.",
    };
  }

  const done = await finalizeDropcontactFromGetContacts(stockTable, id, stock, polled.contacts, {
    requestId,
    leadId: id,
    revalidateOrigin: "pull_success",
    logStage: "pull",
  });

  if (!done.ok) {
    return { ok: false, message: done.message };
  }

  return { ok: true, message: done.message };
}
