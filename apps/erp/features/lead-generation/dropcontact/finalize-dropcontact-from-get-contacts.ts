import { applyDropcontactResultToLead } from "./apply-dropcontact-result";
import { logDropcontact, type DropcontactLogStage } from "./dropcontact-log";
import { revalidateLeadStockDropcontactPaths } from "./revalidate-lead-stock-dropcontact-paths";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { recalculateLeadGenerationCommercialScore } from "../scoring/recalculate-lead-generation-commercial-score";

export type FinalizeDropcontactFromContactsResult =
  | { ok: true; hasUsefulData: boolean; message: string }
  | { ok: false; message: string };

type StockTable = ReturnType<typeof lgTable>;

/**
 * Applique le tableau `data` renvoyé par GET /v1/enrich/all/{request_id} sur une fiche stock.
 * Utilisé par le polling enrich, le bouton « Récupérer le résultat », et peut être réutilisé ailleurs.
 */
export async function finalizeDropcontactFromGetContacts(
  stockTable: StockTable,
  stockId: string,
  stock: LeadGenerationStockRow,
  contacts: Record<string, unknown>[],
  logCtx: { requestId: string; leadId: string; revalidateOrigin: string; logStage: DropcontactLogStage },
): Promise<FinalizeDropcontactFromContactsResult> {
  const { requestId, leadId, revalidateOrigin, logStage } = logCtx;
  const now = new Date().toISOString();

  if (!contacts.length) {
    logDropcontact(logStage, "GET Dropcontact sans données (tableau vide)", { leadId, requestId });
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_status: "failed",
      enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", stockId);
    if (upErr) {
      logDropcontact(logStage, "merge DB KO (GET vide)", { leadId, message: upErr.message });
      return {
        ok: false,
        message: "Mise à jour base refusée après GET (voir logs serveur).",
      };
    }
    revalidateLeadStockDropcontactPaths(stockId, `${revalidateOrigin}_empty`);
    return { ok: true, hasUsefulData: false, message: "Dropcontact n’a pas trouvé de données exploitables." };
  }

  const contact = contacts[0];
  if (!contact || typeof contact !== "object") {
    logDropcontact(logStage, "GET premier contact invalide", { leadId, requestId });
    const noDataPatch = {
      dropcontact_status: "failed",
      dropcontact_completed_at: now,
      dropcontact_last_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_status: "failed",
      enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
      enrichment_source: "dropcontact",
      updated_at: now,
    };
    const { error: upErr } = await stockTable.update(noDataPatch).eq("id", stockId);
    if (upErr) {
      return {
        ok: false,
        message: "Mise à jour base refusée après GET (voir logs serveur).",
      };
    }
    revalidateLeadStockDropcontactPaths(stockId, `${revalidateOrigin}_bad_contact`);
    return { ok: true, hasUsefulData: false, message: "Dropcontact n’a pas trouvé de données exploitables." };
  }

  const { patch, hasUsefulData } = applyDropcontactResultToLead(stock, contact as Record<string, unknown>);
  const { error: upErr } = await stockTable.update({ ...patch, updated_at: now }).eq("id", stockId);

  if (upErr) {
    logDropcontact(logStage, "merge DB KO après fusion Dropcontact", { leadId, message: upErr.message });
    const { error: failErr } = await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: "Mise à jour base refusée après réponse Dropcontact (voir logs).",
        enrichment_status: "failed",
        enrichment_error: "Mise à jour base refusée après réponse Dropcontact (voir logs).",
        updated_at: new Date().toISOString(),
      })
      .eq("id", stockId);
    if (failErr) {
      logDropcontact(logStage, "Échec patch d’erreur secondaire", { leadId, message: failErr.message });
    }
    revalidateLeadStockDropcontactPaths(stockId, `${revalidateOrigin}_merge_fail`);
    return { ok: false, message: "Mise à jour base refusée après GET (voir logs serveur)." };
  }

  logDropcontact(logStage, "merge DB OK", { leadId, requestId, hasUsefulData });

  if (hasUsefulData) {
    try {
      await recalculateLeadGenerationCommercialScore(stockId);
      await evaluateLeadGenerationDispatchQueue({ stockId });
    } catch (e) {
      logDropcontact(logStage, "Post-traitement score/file non bloquant en erreur", {
        leadId,
        error: String(e),
      });
    }
  }

  revalidateLeadStockDropcontactPaths(stockId, revalidateOrigin);
  return {
    ok: true,
    hasUsefulData,
    message: hasUsefulData
      ? "Fiche enrichie avec succès."
      : "Dropcontact n’a pas trouvé de données exploitables.",
  };
}
