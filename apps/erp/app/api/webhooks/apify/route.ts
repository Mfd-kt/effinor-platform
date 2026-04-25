import { NextRequest, NextResponse } from "next/server";

import { syncLeboncoinImmobilierImport } from "@/features/lead-generation/apify/sources/leboncoin-immobilier/sync-import";
import { syncPapImport } from "@/features/lead-generation/apify/sources/pap/sync-import";
import { syncPapLocationImport } from "@/features/lead-generation/apify/sources/pap_location/sync-import";
import { notifyApifyImportCompleted } from "@/features/lead-generation/services/notify-apify-import-completed";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Apify — notification de fin de run.
 * `POST /api/webhooks/apify`
 *
 * Apify envoie une requête POST quand un run se termine (ACTOR.RUN.SUCCEEDED
 * ou ACTOR.RUN.FAILED). On retrouve le batch via `external_run_id` et on
 * lance la sync correspondante immédiatement (au lieu d'attendre le cron 3 min).
 *
 * Sécurisation : header `x-apify-webhook-secret` doit matcher
 * `process.env.APIFY_WEBHOOK_SECRET`.
 *
 * @see https://docs.apify.com/platform/integrations/webhooks
 */

const SOURCE_TO_SYNC = {
  pap: syncPapImport,
  pap_location: syncPapLocationImport,
  leboncoin_immobilier: syncLeboncoinImmobilierImport,
} as const;

type SourceCode = keyof typeof SOURCE_TO_SYNC;

function isKnownSource(s: string): s is SourceCode {
  return s in SOURCE_TO_SYNC;
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.APIFY_WEBHOOK_SECRET;
    if (!expectedSecret?.trim()) {
      console.error("[apify-webhook] APIFY_WEBHOOK_SECRET manquant — refus");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const apifySecret = req.headers.get("x-apify-webhook-secret");
    if (apifySecret !== expectedSecret) {
      console.error("[apify-webhook] secret invalide");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: Record<string, unknown> = await req.json();
    const eventType = String(payload.eventType ?? "");

    console.log("[apify-webhook] notification reçue:", {
      eventType,
      resourceId: (payload.resource as { id?: string } | undefined)?.id,
    });

    const resource = payload.resource as
      | { id?: string; actId?: string; defaultDatasetId?: string; status?: string }
      | undefined;
    const eventData = payload.eventData as { actorRunId?: string; actorId?: string } | undefined;
    const runId = resource?.id ?? eventData?.actorRunId;

    if (!runId) {
      console.warn("[apify-webhook] pas de runId — ignore");
      return NextResponse.json({ received: true, error: "no run id" });
    }

    // 1. Retrouver le batch par external_run_id
    const admin = createAdminClient();
    const { data: batch, error: batchErr } = await admin
      .from("lead_generation_import_batches")
      .select("id, source")
      .eq("external_run_id", runId)
      .maybeSingle();

    if (batchErr) {
      console.error("[apify-webhook] lookup batch error:", batchErr.message);
      return NextResponse.json({ received: true, error: "batch lookup failed" });
    }
    if (!batch) {
      console.warn("[apify-webhook] aucun batch trouvé pour runId:", runId);
      return NextResponse.json({ received: true, error: "batch not found" });
    }

    const source = String(batch.source);
    if (!isKnownSource(source)) {
      console.warn("[apify-webhook] source inconnue:", source);
      return NextResponse.json({ received: true, error: `unknown source: ${source}` });
    }

    // 2. Si run échoué → notification d'échec direct (sans sync)
    if (eventType === "ACTOR.RUN.FAILED" || eventType === "ACTOR.RUN.ABORTED" || eventType === "ACTOR.RUN.TIMED_OUT") {
      console.log("[apify-webhook] run échoué, notification:", { runId, eventType });
      await admin
        .from("lead_generation_import_batches")
        .update({
          status: "failed",
          error_summary: `Apify ${eventType}`,
          finished_at: new Date().toISOString(),
        })
        .eq("id", batch.id);
      await notifyApifyImportCompleted({
        batchId: batch.id,
        outcome: "failure",
        source,
        errorSummary: `Apify ${eventType}`,
        client: admin,
      });
      return NextResponse.json({ received: true, batchId: batch.id, action: "failed" });
    }

    // 3. Run réussi → déclencher la sync (qui fera la notification de succès)
    if (eventType !== "ACTOR.RUN.SUCCEEDED") {
      console.log("[apify-webhook] événement ignoré:", eventType);
      return NextResponse.json({ received: true });
    }

    console.log("[apify-webhook] lancement sync immédiate", {
      batchId: batch.id,
      source,
      runId,
    });

    const syncFn = SOURCE_TO_SYNC[source];
    const result = await syncFn(batch.id);

    return NextResponse.json({
      received: true,
      batchId: batch.id,
      source,
      result,
    });
  } catch (error) {
    console.error("[apify-webhook] erreur:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
/** Le sync peut prendre jusqu'à 60s (Apify dataset large). */
export const maxDuration = 120;
