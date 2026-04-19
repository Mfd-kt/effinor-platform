"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import type { SyncGoogleMapsApifyImportResult } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { assessLeadGenerationImportSyncRetryEligibility } from "../lib/lead-generation-import-sync-retry-eligibility";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { retryLeadGenerationImportSyncActionInputSchema } from "../schemas/lead-generation-actions.schema";

export type RetryLeadGenerationImportSyncOutcome =
  | "retried_success"
  | "still_failed"
  | "not_retryable"
  | "no_recoverable_data"
  | "still_in_progress";

export type RetryLeadGenerationImportSyncActionPayload = {
  outcome: RetryLeadGenerationImportSyncOutcome;
  message: string;
  batchStatus?: string | null;
};

function interpretSyncAfterRetry(data: SyncGoogleMapsApifyImportResult): RetryLeadGenerationImportSyncActionPayload {
  const { phase } = data;
  if (phase === "completed" || phase === "already_completed") {
    return {
      outcome: "retried_success",
      message: "Synchronisation relancée avec succès.",
      batchStatus: "completed",
    };
  }
  if (phase === "running" || phase === "ingesting_elsewhere") {
    return {
      outcome: "still_in_progress",
      message:
        "Tentative effectuée : le traitement Apify ou l’intégration est encore en cours. Vous pourrez vérifier ce lot à nouveau dans quelques instants.",
    };
  }
  if (phase === "invalid_batch" || phase === "batch_failed") {
    return {
      outcome: "not_retryable",
      message: "Ce lot ne peut pas être resynchronisé.",
    };
  }

  const detail = `${data.message ?? ""} ${data.error ?? ""}`.toLowerCase();
  if (detail.includes("pas encore prêt")) {
    return {
      outcome: "still_in_progress",
      message:
        "La synchronisation a été relancée, mais le run Apify n’est pas encore prêt. Réessayez dans quelques instants.",
    };
  }
  if (detail.includes("dataset vide") || detail.includes("aucun dataset") || detail.includes("sans dataset")) {
    return {
      outcome: "no_recoverable_data",
      message: "Apify ne contient pas de données exploitables pour ce lot.",
      batchStatus: "failed",
    };
  }

  return {
    outcome: "still_failed",
    message: "Le lot reste en échec après nouvelle tentative.",
    batchStatus: "failed",
  };
}

/**
 * Remet un lot `failed` en `running` et nettoie les champs de blocage pour permettre le « claim » d’ingestion.
 */
async function prepareFailedImportBatchForSyncRetry(batchId: string): Promise<boolean> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const { data, error } = await batches
    .update({
      status: "running",
      finished_at: null,
      error_summary: null,
      ingest_started_at: null,
    } as never)
    .eq("id", batchId)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }
  return true;
}

export async function retryLeadGenerationImportSyncAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RetryLeadGenerationImportSyncActionPayload>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = retryLeadGenerationImportSyncActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant de lot invalide." };
  }

  const batchId = parsed.data.batchId;
  const row = await getLeadGenerationImportBatchById(batchId);
  if (!row) {
    return { ok: false, error: "Lot introuvable." };
  }

  const eligibility = assessLeadGenerationImportSyncRetryEligibility(row);
  if (!eligibility.retryable) {
    return {
      ok: true,
      data: {
        outcome: "not_retryable",
        message: eligibility.userMessage,
        batchStatus: row.status,
      },
    };
  }

  const prepared = await prepareFailedImportBatchForSyncRetry(batchId);
  if (!prepared) {
    return {
      ok: true,
      data: {
        outcome: "not_retryable",
        message: "Ce lot ne peut pas être resynchronisé (état du lot modifié entre-temps).",
        batchStatus: row.status,
      },
    };
  }

  const retryFlag = { retryFromFailed: true as const };

  try {
    const data = await syncGoogleMapsApifyImport({ batchId, ...retryFlag });

    const payload = interpretSyncAfterRetry(data);
    const fresh = await getLeadGenerationImportBatchById(batchId);
    if (fresh?.status) {
      payload.batchStatus = fresh.status;
    }

    revalidatePath(`/lead-generation/imports/${batchId}`);
    revalidatePath("/lead-generation/imports");

    return { ok: true, data: payload };
  } catch {
    revalidatePath(`/lead-generation/imports/${batchId}`);
    revalidatePath("/lead-generation/imports");
    return {
      ok: true,
      data: {
        outcome: "still_failed",
        message: "Le lot reste en échec après nouvelle tentative.",
        batchStatus: "failed",
      },
    };
  }
}
