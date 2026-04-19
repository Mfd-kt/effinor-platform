"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import {
  buildDropcontactEnrichmentPayload,
  isEligibleForDropcontactEnrichment,
} from "../dropcontact/build-dropcontact-request";
import { finalizeDropcontactFromGetContacts } from "../dropcontact/finalize-dropcontact-from-get-contacts";
import { logDropcontact } from "../dropcontact/dropcontact-log";
import { pollDropcontactUntilReady } from "../dropcontact/poll-dropcontact-with-get";
import { summarizeDropcontactPayloadForLog } from "../dropcontact/payload-log-summary";
import { revalidateLeadStockDropcontactPaths } from "../dropcontact/revalidate-lead-stock-dropcontact-paths";
import { getDropcontactApiKey, sendDropcontactEnrichmentRequest } from "../dropcontact/client";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

export type EnrichLeadWithDropcontactResult =
  | { ok: true; message: string; variant?: "success" | "warn" }
  | { ok: false; message: string };

export async function canUseDropcontactOnStock(
  accessUserId: string,
  stock: LeadGenerationStockRow,
  hub: boolean,
): Promise<boolean> {
  if (hub) return true;
  const aid = stock.current_assignment_id;
  if (!aid) return false;
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data } = await assignments.select("agent_id").eq("id", aid).maybeSingle();
  const row = data as { agent_id: string } | null;
  return row?.agent_id === accessUserId;
}

/**
 * POST Dropcontact → enregistrement request_id → polling GET serveur (comme n8n).
 * Le webhook reste optionnel pour accélérer la mise à jour si configuré.
 */
export async function enrichLeadWithDropcontactAction(stockId: string): Promise<EnrichLeadWithDropcontactResult> {
  const id = stockId?.trim();
  if (!id) {
    logDropcontact("enrich", "Abandon : fiche invalide");
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    logDropcontact("enrich", "Abandon : non authentifié", { leadId: id });
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const queue = canAccessLeadGenerationMyQueue(access);
  if (!hub && !queue) {
    logDropcontact("enrich", "Abandon : accès refusé", { leadId: id });
    return { ok: false, message: "Accès refusé." };
  }

  if (!getDropcontactApiKey()) {
    logDropcontact("enrich", "Abandon : clé API absente", { leadId: id });
    return {
      ok: false,
      message:
        "Dropcontact n’est pas configuré sur le serveur : ajoutez DROPCONTACT_API_KEY (ou DROPCONTACT_ACCESS_TOKEN) dans l’environnement, puis redémarrez l’app.",
    };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error: loadErr } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (loadErr || !row) {
    logDropcontact("enrich", "Abandon : fiche introuvable", { leadId: id, loadError: loadErr?.message });
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = row as LeadGenerationStockRow;

  if (stock.converted_lead_id) {
    logDropcontact("enrich", "Abandon : fiche convertie", { leadId: id });
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (stock.stock_status === "rejected") {
    logDropcontact("enrich", "Abandon : stock rejeté", { leadId: id });
    return { ok: false, message: "Action impossible pour le moment." };
  }

  if (!(await canUseDropcontactOnStock(access.userId, stock, hub))) {
    logDropcontact("enrich", "Abandon : fiche non attribuée", { leadId: id, userId: access.userId });
    return { ok: false, message: "Cette fiche ne vous est pas attribuée." };
  }

  const elig = isEligibleForDropcontactEnrichment(stock);
  if (!elig.ok) {
    logDropcontact("enrich", "Abandon : non éligible", { leadId: id });
    return { ok: false, message: elig.reason };
  }

  if (stock.dropcontact_status === "pending") {
    logDropcontact("enrich", "Abandon : déjà pending", { leadId: id });
    return { ok: false, message: "Enrichissement en cours…" };
  }

  const payloadBuild = buildDropcontactEnrichmentPayload(stock);
  if (!payloadBuild.ok) {
    logDropcontact("enrich", "Abandon : payload invalide", { leadId: id, reason: payloadBuild.reason });
    return { ok: false, message: payloadBuild.reason };
  }

  logDropcontact("enrich", "Payload prêt (aperçu)", {
    leadId: id,
    payload: summarizeDropcontactPayloadForLog(payloadBuild.body),
  });

  const now = new Date().toISOString();

  const { data: locked, error: lockErr } = await stockTable
    .update({
      dropcontact_status: "pending",
      dropcontact_last_error: null,
      dropcontact_requested_at: now,
      dropcontact_request_id: null,
      dropcontact_completed_at: null,
      enrichment_status: "in_progress",
      enrichment_error: null,
      updated_at: now,
    })
    .eq("id", id)
    .neq("dropcontact_status", "pending")
    .select("id");

  if (lockErr) {
    logDropcontact("enrich", "Verrou pending échoué", { leadId: id, message: lockErr.message });
    return { ok: false, message: "Enrichissement interrompu. Réessayez plus tard." };
  }
  if (!locked?.length) {
    logDropcontact("enrich", "Verrou pending : ligne déjà pending ou concurrence", { leadId: id });
    return { ok: false, message: "Enrichissement en cours…" };
  }

  logDropcontact("enrich", "Envoi POST Dropcontact", { leadId: id });

  const post = await sendDropcontactEnrichmentRequest(payloadBuild.body);

  if (!post.ok) {
    logDropcontact("enrich", "POST Dropcontact échec", {
      leadId: id,
      code: post.code,
      httpStatus: post.httpStatus,
      message: post.message,
    });
    await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: post.message,
        enrichment_status: "failed",
        enrichment_error: post.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidateLeadStockDropcontactPaths(id, "enrich_post_failed");
    return { ok: false, message: post.message };
  }

  logDropcontact("enrich", "POST OK, request_id reçu", { leadId: id, requestId: post.request_id });

  const { error: ridErr } = await stockTable
    .update({
      dropcontact_request_id: post.request_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (ridErr) {
    logDropcontact("enrich", "Échec persistance request_id après POST OK", {
      leadId: id,
      requestId: post.request_id,
      message: ridErr.message,
    });
    await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: "Enregistrement du request_id impossible.",
        enrichment_status: "failed",
        enrichment_error: "Enregistrement du request_id impossible.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidateLeadStockDropcontactPaths(id, "enrich_request_id_persist_failed");
    return { ok: false, message: "Enregistrement du request_id impossible." };
  }

  revalidateLeadStockDropcontactPaths(id, "enrich_request_id_saved");

  const pollOutcome = await pollDropcontactUntilReady(post.request_id, { leadId: id });

  const { data: freshRow, error: freshErr } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (freshErr || !freshRow) {
    logDropcontact("enrich", "Relecture fiche impossible après polling", { leadId: id });
    return { ok: false, message: "Fiche introuvable après traitement Dropcontact." };
  }
  const fresh = freshRow as LeadGenerationStockRow;

  if (fresh.dropcontact_status !== "pending") {
    logDropcontact("enrich", "Finalisation déjà faite (webhook ou concurrence)", {
      leadId: id,
      dropcontact_status: fresh.dropcontact_status,
    });
    revalidateLeadStockDropcontactPaths(id, "enrich_skip_poll_already_final");
    if (fresh.dropcontact_status === "completed") {
      return { ok: true, message: "Fiche enrichie avec succès.", variant: "success" };
    }
    if (fresh.dropcontact_status === "failed") {
      return {
        ok: false,
        message: fresh.dropcontact_last_error ?? "Dropcontact n’a pas trouvé de données exploitables.",
      };
    }
    return { ok: true, message: "État Dropcontact déjà à jour.", variant: "success" };
  }

  if (pollOutcome.outcome === "failed") {
    logDropcontact("enrich", "Polling : GET définitivement en erreur", { leadId: id, message: pollOutcome.message });
    await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: pollOutcome.message,
        enrichment_status: "failed",
        enrichment_error: pollOutcome.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidateLeadStockDropcontactPaths(id, "enrich_poll_get_failed");
    return { ok: false, message: pollOutcome.message };
  }

  if (pollOutcome.outcome === "timeout") {
    logDropcontact("enrich", "Polling : fenêtre dépassée, fiche laissée en pending", { leadId: id });
    await stockTable
      .update({
        dropcontact_last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidateLeadStockDropcontactPaths(id, "enrich_poll_timeout");
    return {
      ok: true,
      message: "Résultat pas encore prêt, réessayez dans quelques instants.",
      variant: "warn",
    };
  }

  const done = await finalizeDropcontactFromGetContacts(
    stockTable,
    id,
    fresh,
    pollOutcome.contacts,
    {
      requestId: post.request_id,
      leadId: id,
      revalidateOrigin: "enrich_poll_success",
      logStage: "enrich",
    },
  );

  if (!done.ok) {
    return { ok: false, message: done.message };
  }

  return {
    ok: true,
    message: done.message,
    variant: done.hasUsefulData ? "success" : "warn",
  };
}
