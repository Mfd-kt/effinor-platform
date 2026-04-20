"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { finalizeDropcontactFromGetContacts } from "../dropcontact/finalize-dropcontact-from-get-contacts";
import { fetchDropcontactEnrichmentResult } from "../dropcontact/client";
import { logDropcontact } from "../dropcontact/dropcontact-log";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import {
  canApplyLeadGenerationDropcontactToStock,
  canInitiateLeadGenerationDropcontact,
} from "../lib/lead-generation-dropcontact-access";
import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";
import { lgTable } from "../lib/lg-db";

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
  const quantifier = canAccessLeadGenerationQuantification(access);
  if (!(await canInitiateLeadGenerationDropcontact(access))) {
    logDropcontact("pull", "Abandon : accès refusé", { leadId: id });
    return { ok: false, message: "Dropcontact réservé au pilotage ou au quantificateur." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const detail = await getLeadGenerationStockById(id);
  if (!detail) {
    logDropcontact("pull", "Fiche introuvable", { leadId: id });
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = detail.stock;

  if (quantifier && !hub) {
    const gate = await assertQuantifierMayActOnQuantificationStock(supabase, access, stock, detail.import_batch);
    if (!gate.ok) {
      logDropcontact("pull", "Abandon : périmètre quantificateur", { leadId: id });
      return { ok: false, message: gate.message };
    }
  }

  if (stock.converted_lead_id) {
    logDropcontact("pull", "Abandon : convertie", { leadId: id });
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (!canApplyLeadGenerationDropcontactToStock(stock, { hub, quantifier })) {
    logDropcontact("pull", "Abandon : périmètre fiche", { leadId: id });
    return {
      ok: false,
      message:
        "Cette fiche n’est pas éligible au Dropcontact avec votre rôle (hors file à qualifier ou hors pilotage).",
    };
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
