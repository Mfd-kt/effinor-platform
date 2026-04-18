import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { lgTable } from "../lib/lg-db";
import { mergeMultiSourceRows } from "../lib/multi-source-merge";
import { getApifyDatasetItems, getApifyToken } from "../apify/client";
import { mapGoogleMapsApifyItem } from "../apify/map-google-maps-item";
import type { MappedApifyStockRow } from "../apify/map-google-maps-item";
import { mapYellowPagesApifyItem } from "../apify/map-yellow-pages-apify-item";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { ingestLeadGenerationStock } from "./ingest-lead-generation-stock";

export type SyncMultiSourceCoordinatorPhase =
  | "running"
  | "maps_ingested"
  | "completed"
  | "already_completed"
  | "failed"
  | "invalid_batch";

export type SyncMultiSourceCoordinatorResult = {
  phase: SyncMultiSourceCoordinatorPhase;
  coordinatorBatchId: string;
  message?: string;
  mergedRowCount?: number;
  ingestedCount?: number;
  acceptedCount?: number;
  error?: string;
};

function readCoordinatorChildren(meta: unknown): {
  mapsBatchId?: string;
  yellowPagesBatchId?: string | null;
  ypSkipped?: boolean;
  deferYellowPages?: boolean;
} | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const ms = (meta as Record<string, unknown>).multiSource;
  if (!ms || typeof ms !== "object") return null;
  const m = ms as Record<string, unknown>;
  const mapsBatchId = typeof m.mapsBatchId === "string" ? m.mapsBatchId : undefined;
  const yellowPagesBatchId =
    typeof m.yellowPagesBatchId === "string"
      ? m.yellowPagesBatchId
      : m.yellowPagesBatchId === null
        ? null
        : undefined;
  const ypSkipped = m.ypSkipped === true;
  const deferYellowPages = m.deferYellowPages === true;
  return { mapsBatchId, yellowPagesBatchId, ypSkipped, deferYellowPages };
}

function readCoordinatorPhase(meta: unknown): string | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const ms = (meta as Record<string, unknown>).multiSource;
  if (!ms || typeof ms !== "object") return undefined;
  const p = (ms as Record<string, unknown>).phase;
  return typeof p === "string" ? p : undefined;
}

async function loadMappedFromDataset(
  batchId: string,
  mapOne: (item: unknown, i: number) => MappedApifyStockRow,
): Promise<LeadGenerationRawStockInput[]> {
  const row = await getLeadGenerationImportBatchById(batchId);
  if (!row || row.status !== "completed") {
    return [];
  }
  const ds = row.external_dataset_id?.trim();
  if (!ds) return [];
  const token = getApifyToken();
  const items = await getApifyDatasetItems(token, ds);
  const out: LeadGenerationRawStockInput[] = [];
  for (let i = 0; i < items.length; i++) {
    const m = mapOne(items[i], i);
    if (m.ok) out.push(m.row);
  }
  return out;
}

/**
 * Clôture le coordinateur après overlay Pages Jaunes (parcours unifié).
 */
export async function finalizeDeferredMultiSourceCoordinator(coordinatorBatchId: string): Promise<void> {
  const row = await getLeadGenerationImportBatchById(coordinatorBatchId);
  if (!row || row.source !== "apify_multi_source") return;
  if (row.status === "completed") return;

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const finishedAt = new Date().toISOString();
  const metaRoot =
    typeof row.metadata_json === "object" && row.metadata_json !== null && !Array.isArray(row.metadata_json)
      ? { ...(row.metadata_json as Record<string, unknown>) }
      : {};
  const prevMs =
    typeof metaRoot.multiSource === "object" && metaRoot.multiSource !== null && !Array.isArray(metaRoot.multiSource)
      ? { ...(metaRoot.multiSource as Record<string, unknown>) }
      : {};

  await batches
    .update({
      status: "completed",
      finished_at: finishedAt,
      metadata_json: {
        ...metaRoot,
        multiSource: {
          ...prevMs,
          phase: "merged",
          at: finishedAt,
        },
      } as unknown as Json,
    } as never)
    .eq("id", coordinatorBatchId);
}

/**
 * Quand les imports enfants Maps (+ optionnellement Pages Jaunes) sont terminés en mode `deferIngest`,
 * fusionne les lignes et ingère sur le batch coordinateur.
 * Mode `deferYellowPages` : ingestion Maps seule d’abord (`maps_ingested`), puis overlay YP côté parcours unifié.
 */
export async function syncMultiSourceCoordinatorImport(input: {
  coordinatorBatchId: string;
}): Promise<SyncMultiSourceCoordinatorResult> {
  const { coordinatorBatchId } = input;
  const row = await getLeadGenerationImportBatchById(coordinatorBatchId);
  if (!row) {
    return { phase: "invalid_batch", coordinatorBatchId, message: "Coordinateur introuvable." };
  }
  if (row.source !== "apify_multi_source") {
    return { phase: "invalid_batch", coordinatorBatchId, message: "Ce batch n’est pas un coordinateur multi-source." };
  }

  const msPhaseEarly = readCoordinatorPhase(row.metadata_json);
  if (msPhaseEarly === "maps_ingested") {
    return {
      phase: "maps_ingested",
      coordinatorBatchId,
      message: "Carte importée ; étape Pages Jaunes ou suite du parcours.",
      ingestedCount: row.imported_count,
      acceptedCount: row.accepted_count,
    };
  }

  if (row.status === "completed") {
    return {
      phase: "already_completed",
      coordinatorBatchId,
      message: "Fusion déjà effectuée.",
      ingestedCount: row.imported_count,
      acceptedCount: row.accepted_count,
    };
  }
  if (row.status === "failed") {
    return {
      phase: "failed",
      coordinatorBatchId,
      message: row.error_summary ?? "Coordinateur en échec.",
      error: row.error_summary ?? undefined,
    };
  }

  const children = readCoordinatorChildren(row.metadata_json);
  if (!children?.mapsBatchId) {
    return {
      phase: "invalid_batch",
      coordinatorBatchId,
      message: "Métadonnées coordinateur incomplètes (mapsBatchId).",
    };
  }

  const deferYellow = children.deferYellowPages === true;

  const mapsRow = await getLeadGenerationImportBatchById(children.mapsBatchId);
  if (!mapsRow || mapsRow.status !== "completed") {
    return {
      phase: "running",
      coordinatorBatchId,
      message: "Import Google Maps pas encore prêt pour la fusion.",
    };
  }

  if (!deferYellow && !children.ypSkipped && children.yellowPagesBatchId) {
    const yp = await getLeadGenerationImportBatchById(children.yellowPagesBatchId);
    if (!yp || yp.status !== "completed") {
      return {
        phase: "running",
        coordinatorBatchId,
        message: "Import Pages Jaunes pas encore prêt pour la fusion.",
      };
    }
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const now = new Date().toISOString();

  const { data: claimRows, error: claimErr } = await batches
    .update({ ingest_started_at: now } as never)
    .eq("id", coordinatorBatchId)
    .eq("status", "running")
    .is("ingest_started_at", null)
    .select("id");

  if (claimErr) {
    return {
      phase: "failed",
      coordinatorBatchId,
      error: claimErr.message,
      message: claimErr.message,
    };
  }

  if (!claimRows || claimRows.length === 0) {
    const again = await getLeadGenerationImportBatchById(coordinatorBatchId);
    if (again?.status === "completed") {
      return { phase: "already_completed", coordinatorBatchId, message: "Déjà fusionné." };
    }
    if (readCoordinatorPhase(again?.metadata_json) === "maps_ingested") {
      return {
        phase: "maps_ingested",
        coordinatorBatchId,
        message: "Carte importée ; étape Pages Jaunes ou suite du parcours.",
        acceptedCount: again?.accepted_count,
        ingestedCount: again?.imported_count,
      };
    }
    return {
      phase: "running",
      coordinatorBatchId,
      message: "Fusion déjà en cours ailleurs.",
    };
  }

  try {
    const mapsRows = await loadMappedFromDataset(children.mapsBatchId, mapGoogleMapsApifyItem);
    let ypRows: LeadGenerationRawStockInput[] = [];
    if (!deferYellow && !children.ypSkipped && children.yellowPagesBatchId) {
      ypRows = await loadMappedFromDataset(children.yellowPagesBatchId, mapYellowPagesApifyItem);
    }

    const merged = mergeMultiSourceRows(mapsRows, ypRows);
    const ingest = await ingestLeadGenerationStock(coordinatorBatchId, merged, {
      finalizeBatch: !deferYellow,
    });

    if (!ingest.ok) {
      const finishedAt = new Date().toISOString();
      await batches
        .update({
          status: "failed",
          finished_at: finishedAt,
          error_summary: (ingest.message ?? "Ingestion fusion").slice(0, 2000),
        } as never)
        .eq("id", coordinatorBatchId);
      return {
        phase: "failed",
        coordinatorBatchId,
        error: ingest.message,
        message: ingest.message,
      };
    }

    const s = ingest.summary;
    const finishedAt = new Date().toISOString();
    const metaRoot =
      typeof row.metadata_json === "object" && row.metadata_json !== null && !Array.isArray(row.metadata_json)
        ? { ...(row.metadata_json as Record<string, unknown>) }
        : {};
    const prevMs =
      typeof metaRoot.multiSource === "object" && metaRoot.multiSource !== null && !Array.isArray(metaRoot.multiSource)
        ? { ...(metaRoot.multiSource as Record<string, unknown>) }
        : {};

    if (deferYellow) {
      await batches
        .update({
          imported_count: s.imported_count,
          accepted_count: s.accepted_count,
          duplicate_count: s.duplicate_count,
          rejected_count: s.rejected_count,
          metadata_json: {
            ...metaRoot,
            multiSource: {
              ...prevMs,
              phase: "maps_ingested",
              mergedRowCount: merged.length,
              at: finishedAt,
            },
          } as unknown as Json,
        } as never)
        .eq("id", coordinatorBatchId);

      return {
        phase: "maps_ingested",
        coordinatorBatchId,
        mergedRowCount: merged.length,
        ingestedCount: s.imported_count,
        acceptedCount: s.accepted_count,
        message: "Import carte intégré au lot ; Pages Jaunes à l’étape suivante.",
      };
    }

    await batches
      .update({
        status: "completed",
        finished_at: finishedAt,
        imported_count: s.imported_count,
        accepted_count: s.accepted_count,
        duplicate_count: s.duplicate_count,
        rejected_count: s.rejected_count,
        metadata_json: {
          ...metaRoot,
          multiSource: {
            ...prevMs,
            phase: "merged",
            mergedRowCount: merged.length,
            at: finishedAt,
          },
        } as unknown as Json,
      } as never)
      .eq("id", coordinatorBatchId);

    return {
      phase: "completed",
      coordinatorBatchId,
      mergedRowCount: merged.length,
      ingestedCount: s.imported_count,
      acceptedCount: s.accepted_count,
      message: "Fusion multi-source importée.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur fusion multi-source.";
    const finishedAt = new Date().toISOString();
    await batches
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_summary: msg.slice(0, 2000),
      } as never)
      .eq("id", coordinatorBatchId);
    return {
      phase: "failed",
      coordinatorBatchId,
      error: msg,
      message: msg,
    };
  }
}
