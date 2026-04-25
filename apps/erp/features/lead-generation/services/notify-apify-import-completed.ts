import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

type BatchMeta = {
  triggered_by_user_id?: string | null;
  source_label?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  pap: "PAP.fr — Particuliers (Vente)",
  pap_location: "PAP.fr — Locations",
  leboncoin_immobilier: "Le Bon Coin — Immobilier",
};

/**
 * Enqueue une notification in-app pour signaler la fin d'un import Apify
 * (succès ou échec). Lit `metadata_json.triggered_by_user_id` du batch.
 *
 * Idempotent via `dedupe_key = "apify_import:<batchId>"`.
 */
export async function notifyApifyImportCompleted(args: {
  batchId: string;
  outcome: "success" | "failure";
  source: string;
  inserted?: number;
  duplicates?: number;
  rejected?: number;
  errorSummary?: string | null;
  /** Client admin déjà ouvert (sync) ; sinon on en crée un. */
  client?: AdminClient;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = args.client ?? createAdminClient();

  // 1. Lire le batch pour récupérer l'utilisateur déclencheur
  const { data: batchRow, error: batchErr } = await admin
    .from("lead_generation_import_batches")
    .select("metadata_json, source_label")
    .eq("id", args.batchId)
    .maybeSingle();

  if (batchErr) {
    return { ok: false, error: `Batch lookup: ${batchErr.message}` };
  }

  const meta =
    (batchRow as { metadata_json: BatchMeta | null; source_label: string | null } | null)
      ?.metadata_json ?? {};
  const userId = meta.triggered_by_user_id?.trim() || null;
  if (!userId) {
    // Batch déclenché par cron / sans user (ex: replay) → pas de notification
    return { ok: true };
  }

  const sourceLabel =
    SOURCE_LABELS[args.source] ??
    (batchRow as { source_label: string | null } | null)?.source_label ??
    args.source;

  const dedupeKey = `apify_import:${args.batchId}`;
  const { data: existing } = await admin
    .from("app_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true };
  }

  const inserted = args.inserted ?? 0;
  const duplicates = args.duplicates ?? 0;
  const rejected = args.rejected ?? 0;

  const title =
    args.outcome === "success"
      ? `Import ${sourceLabel} terminé`
      : `Import ${sourceLabel} en échec`;

  const body =
    args.outcome === "success"
      ? `${inserted} fiche${inserted > 1 ? "s" : ""} ajoutée${inserted > 1 ? "s" : ""}, ${duplicates} doublon${duplicates > 1 ? "s" : ""}, ${rejected} rejet${rejected > 1 ? "s" : ""}.`
      : args.errorSummary?.trim() || "Le scrape Apify a échoué — voir le détail du lot.";

  const now = new Date().toISOString();
  const { error: insErr } = await admin.from("app_notifications").insert({
    user_id: userId,
    type: args.outcome === "success" ? "lead_generation_import_completed" : "lead_generation_import_failed",
    title,
    body,
    severity: args.outcome === "success" ? "info" : "warning",
    entity_type: "lead_generation_import_batch",
    entity_id: args.batchId,
    action_url: `/lead-generation/imports/${args.batchId}`,
    is_read: false,
    is_dismissed: false,
    metadata_json: {
      source: args.source,
      inserted,
      duplicates,
      rejected,
    } as Json,
    delivered_at: now,
    dedupe_key: dedupeKey,
  });

  if (insErr) {
    console.error("[notify-apify-import] insert failed", insErr.message);
    return { ok: false, error: insErr.message };
  }

  return { ok: true };
}
