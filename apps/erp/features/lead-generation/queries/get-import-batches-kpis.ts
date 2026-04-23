import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

export type ImportBatchesKpis = {
  /** Lots actuellement en cours de scraping ou en attente de synchro. */
  active: number;
  /** Lots créés depuis le 1er du mois courant (Europe/Paris). */
  monthTotal: number;
  /** Lots completed sur le mois courant. */
  monthCompleted: number;
  /** Lots failed sur le mois courant. */
  monthFailed: number;
};

export type GetImportBatchesKpisParams = {
  /** Restreindre aux lots créés par cet utilisateur (rôle quantifier). */
  createdByUserId?: string | null;
};

/**
 * Calcule les indicateurs synthétiques affichés en haut de l'écran « Imports ».
 * Quatre comptes parallèles sur `lead_generation_import_batches`.
 *
 * Note : on s'aligne sur la convention Postgres de `created_at` (UTC stockée),
 * et on dérive le 1er du mois côté serveur (UTC) — suffisant pour un KPI
 * indicatif. La précision « Europe/Paris » sera affinée si besoin métier.
 */
async function getImportBatchesKpisImpl(params?: { createdByUserId?: string | null }): Promise<ImportBatchesKpis> {
  const supabase = await createClient();
  const batches = () => lgTable(supabase, "lead_generation_import_batches");

  const startOfMonth = (() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  })();

  const createdBy = params?.createdByUserId?.trim();

  const activeQuery = batches()
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "running"]);
  if (createdBy) activeQuery.eq("created_by_user_id", createdBy);

  const monthTotalQuery = batches()
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth);
  if (createdBy) monthTotalQuery.eq("created_by_user_id", createdBy);

  const monthCompletedQuery = batches()
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .eq("status", "completed");
  if (createdBy) monthCompletedQuery.eq("created_by_user_id", createdBy);

  const monthFailedQuery = batches()
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .eq("status", "failed");
  if (createdBy) monthFailedQuery.eq("created_by_user_id", createdBy);

  const [active, monthTotal, monthCompleted, monthFailed] = await Promise.all([
    activeQuery,
    monthTotalQuery,
    monthCompletedQuery,
    monthFailedQuery,
  ]);

  if (active.error) throw new Error(`KPI imports actifs : ${active.error.message}`);
  if (monthTotal.error) throw new Error(`KPI imports du mois : ${monthTotal.error.message}`);
  if (monthCompleted.error) throw new Error(`KPI imports completed : ${monthCompleted.error.message}`);
  if (monthFailed.error) throw new Error(`KPI imports failed : ${monthFailed.error.message}`);

  return {
    active: active.count ?? 0,
    monthTotal: monthTotal.count ?? 0,
    monthCompleted: monthCompleted.count ?? 0,
    monthFailed: monthFailed.count ?? 0,
  };
}

const getImportBatchesKpisCached = cache(
  (ownerKey: string) =>
    getImportBatchesKpisImpl({
      createdByUserId: ownerKey === "all" ? null : ownerKey,
    }),
);

/**
 * Même requêtes que l’ancienne export — wrapper `cache` pour requêtes RSC en parallèle
 * (ex. bannière KPI + page imports).
 */
export async function getImportBatchesKpis(
  params?: GetImportBatchesKpisParams,
): Promise<ImportBatchesKpis> {
  const createdBy = params?.createdByUserId?.trim();
  return getImportBatchesKpisCached(createdBy ? createdBy : "all");
}
