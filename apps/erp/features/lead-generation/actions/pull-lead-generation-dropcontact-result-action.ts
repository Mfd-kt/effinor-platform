"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { applyDropcontactResultToLead } from "../dropcontact/apply-dropcontact-result";
import { fetchDropcontactEnrichmentResult } from "../dropcontact/client";
import { logDropcontact } from "../dropcontact/dropcontact-log";
import { revalidateLeadStockDropcontactPaths } from "../dropcontact/revalidate-lead-stock-dropcontact-paths";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { recalculateLeadGenerationCommercialScore } from "../scoring/recalculate-lead-generation-commercial-score";
import { canUseDropcontactOnStock } from "./enrich-lead-generation-stock-dropcontact-action";

export type PullLeadGenerationDropcontactResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Interroge Dropcontact (GET /v1/enrich/all/{request_id}) pour finaliser une fiche
 * restée en pending si le webhook n’est pas parvenu au serveur.
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
        "Identifiant Dropcontact absent en base : réinitialisez le suivi (pilotage) puis relancez, ou attendez la fin du clic « Enrichir ».",
    };
  }

  logDropcontact("pull", "GET Dropcontact (fallback)", {
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
    logDropcontact("pull", "GET Dropcontact pas encore prêt", {
      leadId: id,
      requestId,
      reason: polled.reason,
    });
    return {
      ok: false,
      message:
        "Dropcontact n’a pas encore terminé. Réessayez dans environ 30 secondes. Si le webhook est configuré, le statut peut aussi passer sans ce bouton.",
    };
  }

  const contacts = polled.contacts;
  const now = new Date().toISOString();

  if (!contacts.length) {
    logDropcontact("pull", "GET Dropcontact sans données", { leadId: id, requestId, itemCount: 0 });
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "GET Dropcontact sans données (tableau vide).",
      enrichment_status: "failed",
      enrichment_error: "GET Dropcontact sans données (tableau vide).",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", id);
    if (upErr) {
      logDropcontact("pull", "Récupération GET : mise à jour DB refusée", { leadId: id, message: upErr.message });
      return {
        ok: false,
        message: "Récupération GET : mise à jour DB refusée (vérifiez RLS / contraintes / logs Supabase).",
      };
    }
    revalidateLeadStockDropcontactPaths(id, "pull_empty_data");
    logDropcontact("pull", "DB mise à jour (GET vide), revalidatePath OK", { leadId: id });
    return { ok: true, message: "GET Dropcontact sans données — fiche marquée en échec." };
  }

  const contact = contacts[0];
  if (!contact || typeof contact !== "object") {
    logDropcontact("pull", "GET premier contact invalide", { leadId: id, requestId });
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "GET Dropcontact sans données exploitables.",
      enrichment_status: "failed",
      enrichment_error: "GET Dropcontact sans données exploitables.",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", id);
    if (upErr) {
      logDropcontact("pull", "Récupération GET : mise à jour DB refusée", { leadId: id, message: upErr.message });
      return {
        ok: false,
        message: "Récupération GET : mise à jour DB refusée (vérifiez RLS / contraintes / logs Supabase).",
      };
    }
    revalidateLeadStockDropcontactPaths(id, "pull_invalid_first_contact");
    return { ok: true, message: "Réponse reçue : aucune donnée exploitable." };
  }

  const { patch, hasUsefulData } = applyDropcontactResultToLead(stock, contact as Record<string, unknown>);
  const { error: upErr } = await stockTable.update({ ...patch, updated_at: now }).eq("id", id);

  if (upErr) {
    logDropcontact("pull", "Récupération GET : merge appliqué mais update DB refusée", {
      leadId: id,
      message: upErr.message,
    });
    const { error: failErr } = await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: "Récupération GET : mise à jour base refusée (voir logs serveur).",
        enrichment_status: "failed",
        enrichment_error: "Récupération GET : mise à jour base refusée (voir logs serveur).",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (failErr) {
      logDropcontact("pull", "Échec patch d’erreur secondaire", { leadId: id, message: failErr.message });
    }
    revalidateLeadStockDropcontactPaths(id, "pull_merge_update_failed");
    return {
      ok: false,
      message: "Récupération GET : mise à jour DB refusée (vérifiez RLS / contraintes / logs Supabase).",
    };
  }

  logDropcontact("pull", "Mise à jour DB OK après GET", { leadId: id, hasUsefulData, requestId });

  if (hasUsefulData) {
    try {
      await recalculateLeadGenerationCommercialScore(id);
      await evaluateLeadGenerationDispatchQueue({ stockId: id });
    } catch (e) {
      logDropcontact("pull", "Post-traitement non bloquant en erreur", { leadId: id, error: String(e) });
    }
  }

  revalidateLeadStockDropcontactPaths(id, "pull_success");
  logDropcontact("pull", "Flux GET terminé", { leadId: id });

  return {
    ok: true,
    message: hasUsefulData
      ? "Fiche mise à jour à partir de Dropcontact (GET). Si l’UI ne change pas : État DB mis à jour mais UI non rafraîchie — utilisez « Forcer refresh » ou F5."
      : "Réponse GET : peu de données utiles. Si l’UI ne change pas : État DB mis à jour mais UI non rafraîchie — utilisez « Forcer refresh » ou F5.",
  };
}
