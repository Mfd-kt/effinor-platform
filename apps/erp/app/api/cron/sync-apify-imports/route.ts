import { NextResponse } from "next/server";

import { syncLeboncoinImmobilierImport } from "@/features/lead-generation/apify/sources/leboncoin-immobilier/sync-import";
import { syncPapImport } from "@/features/lead-generation/apify/sources/pap/sync-import";
import { syncPapLocationImport } from "@/features/lead-generation/apify/sources/pap_location/sync-import";
import type { ApifySourceCode } from "@/features/lead-generation/apify/types";
import { verifyCronBearer } from "@/features/cron/domain/cron-http";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron : synchronise tous les batches Apify en cours (status pending/running).
 * Déclenché toutes les 3 minutes par Dokploy Scheduled Tasks.
 *
 * Sécurisation : `Authorization: Bearer ${AUTOMATION_CRON_SECRET}`
 * (fallback `CRON_SECRET`). Réutilise `verifyCronBearer` partagé avec les
 * autres crons (`/api/cron/automation`, `/api/cron/lead-email-sync`, etc.).
 *
 * Pour ajouter une nouvelle source : mapper son code dans SYNC_HANDLERS.
 */

/** Mapping source → handler de sync correspondant. */
const SYNC_HANDLERS: Record<ApifySourceCode, (batchId: string) => Promise<unknown>> = {
  leboncoin_immobilier: syncLeboncoinImmobilierImport,
  pap: syncPapImport,
  pap_location: syncPapLocationImport,
  // Prochaines sources :
  // pages_jaunes: syncPagesJaunesImport,
};

type SyncResult = {
  batchId: string;
  source: string;
  ok: boolean;
  error?: string;
};

async function runCron(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: SyncResult[];
}> {
  const supabase = createAdminClient();

  const apifySourceCodes = Object.keys(SYNC_HANDLERS);
  const { data: batches, error } = await supabase
    .from("lead_generation_import_batches")
    .select("id, source, status, external_run_id")
    .in("source", apifySourceCodes)
    .in("status", ["pending", "running"])
    .not("external_run_id", "is", null)
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch pending batches: ${error.message}`);
  }

  if (!batches || batches.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results: SyncResult[] = [];
  let succeeded = 0;
  let failed = 0;

  // Sync chaque batch en parallèle (max 5 en concurrent pour éviter rate limit Apify)
  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (batch): Promise<SyncResult> => {
        const handler = SYNC_HANDLERS[batch.source as ApifySourceCode];
        if (!handler) {
          return {
            batchId: batch.id,
            source: batch.source,
            ok: false,
            error: `No handler for source: ${batch.source}`,
          };
        }

        try {
          await handler(batch.id);
          return { batchId: batch.id, source: batch.source, ok: true };
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          return {
            batchId: batch.id,
            source: batch.source,
            ok: false,
            error: errorMsg,
          };
        }
      }),
    );

    for (const r of chunkResults) {
      results.push(r);
      if (r.ok) succeeded++;
      else failed++;
    }
  }

  return {
    processed: batches.length,
    succeeded,
    failed,
    results,
  };
}

async function handler(req: Request) {
  const auth = verifyCronBearer(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const startedAt = Date.now();
    const result = await runCron();
    const durationMs = Date.now() - startedAt;

    console.log("[cron:sync-apify-imports]", { durationMs, ...result });

    return NextResponse.json({
      ok: true,
      durationMs,
      ...result,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron:sync-apify-imports] error:", errorMsg);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}

export { handler as GET, handler as POST };

export const dynamic = "force-dynamic";
/** Le cron peut prendre du temps si plusieurs batches à syncer en parallèle. */
export const maxDuration = 300;
