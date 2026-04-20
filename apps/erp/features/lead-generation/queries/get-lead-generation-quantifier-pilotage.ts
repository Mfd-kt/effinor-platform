import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { listImportBatchIdsForQuantificationOwner } from "../lib/quantification-batch-ownership";
import type { QuantificationImportBatchScope } from "../lib/quantification-viewer-scope";
import { lgTable } from "../lib/lg-db";

export type QuantifierBatchPilotageRow = {
  batchId: string;
  /** `lead_generation_import_batches.source` (ex. apify_google_maps). */
  importSource: string | null;
  sourceLabel: string | null;
  createdAt: string;
  ceeSheetCode: string | null;
  /** Zone / recherche (métadonnées Apify). */
  searchSummary: string | null;
  /** `imported_count` du lot (brut source). */
  importedRaw: number;
  acceptedCount: number;
  qualifiedCount: number;
  /** Hors cible / rejet qualification côté quantif. */
  rejectedCount: number;
  /** Encore `pending` / `to_validate`, prêts pour la file (non converti, non assigné, pas doublon). */
  pendingWorkCount: number;
  /** `qualified / (qualified + rejected)` en %, ou `null` si aucune décision. */
  qualificationRatePercent: number | null;
  /** Propriétaire du lot (hub seulement). */
  ownerDisplay: string | null;
};

export type QuantifierPilotageLifetimeTotals = {
  batchCount: number;
  importedRawSum: number;
  qualifiedCount: number;
  rejectedCount: number;
  pendingWorkCount: number;
  avgQualificationRatePercent: number | null;
};

export type QuantifierPilotageBundle = {
  recentBatches: QuantifierBatchPilotageRow[];
  /** Agrégats sur tous les lots du périmètre (quantificateur : ses lots ; hub : tous les lots). */
  lifetime: QuantifierPilotageLifetimeTotals;
};

function summarizeBatchMetadata(metadata: Json | null | undefined): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const o = metadata as Record<string, unknown>;
  const loc = typeof o.locationQuery === "string" ? o.locationQuery.trim() : "";
  const ss = o.searchStrings;
  const kw =
    Array.isArray(ss) && ss.length > 0
      ? ss
          .map((x) => (typeof x === "string" ? x.trim() : ""))
          .filter(Boolean)
          .slice(0, 3)
          .join(", ")
      : "";
  const parts = [kw ? `Recherche : ${kw}` : "", loc ? `Zone : ${loc}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type StockAgg = {
  qualified: number;
  rejected: number;
  pendingWork: number;
};

function emptyAgg(): StockAgg {
  return { qualified: 0, rejected: 0, pendingWork: 0 };
}

function accumulateStockRow(
  agg: Map<string, StockAgg>,
  batchId: string | null,
  qualificationStatus: string,
  stockStatus: string,
  convertedLeadId: string | null,
  currentAssignmentId: string | null,
  duplicateOfStockId: string | null,
): void {
  if (!batchId?.trim()) {
    return;
  }
  const id = batchId.trim();
  if (!agg.has(id)) {
    agg.set(id, emptyAgg());
  }
  const a = agg.get(id)!;
  if (qualificationStatus === "qualified") {
    a.qualified += 1;
    return;
  }
  if (qualificationStatus === "rejected") {
    a.rejected += 1;
    return;
  }
  if (
    (qualificationStatus === "pending" || qualificationStatus === "to_validate") &&
    !convertedLeadId &&
    !currentAssignmentId &&
    !duplicateOfStockId &&
    (stockStatus === "new" || stockStatus === "ready")
  ) {
    a.pendingWork += 1;
  }
}

/**
 * Pilotage quantificateur : lots récents + agrégats cycle de vie (décisions / volumes).
 */
export async function getLeadGenerationQuantifierPilotage(
  batchScope: QuantificationImportBatchScope,
  opts?: { recentBatchLimit?: number },
): Promise<QuantifierPilotageBundle> {
  const supabase = await createClient();
  const batchesT = lgTable(supabase, "lead_generation_import_batches");
  const stockT = lgTable(supabase, "lead_generation_stock");
  const recentLimit = Math.min(Math.max(opts?.recentBatchLimit ?? 25, 1), 80);

  let recentQuery = batchesT
    .select(
      `
      id,
      source,
      source_label,
      created_at,
      cee_sheet_code,
      imported_count,
      accepted_count,
      metadata_json,
      created_by_user_id,
      created_by_profile:profiles!created_by_user_id(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(recentLimit);

  if (batchScope.mode === "own") {
    recentQuery = recentQuery.eq("created_by_user_id", batchScope.userId);
  }

  const { data: recentRows, error: recentErr } = await recentQuery;
  if (recentErr) {
    throw new Error(recentErr.message);
  }

  type ProfileEmb = { full_name: string | null; email: string | null };
  const recentList = (recentRows ?? []).map((raw: Record<string, unknown>) => {
    const profRaw = raw.created_by_profile as ProfileEmb | ProfileEmb[] | null | undefined;
    const prof = Array.isArray(profRaw) ? profRaw[0] ?? null : profRaw ?? null;
    return {
      id: String(raw.id),
      source: (raw.source as string | null) ?? null,
      source_label: (raw.source_label as string | null) ?? null,
      created_at: String(raw.created_at),
      cee_sheet_code: (raw.cee_sheet_code as string | null) ?? null,
      imported_count: Number(raw.imported_count ?? 0),
      accepted_count: Number(raw.accepted_count ?? 0),
      metadata_json: raw.metadata_json as Json,
      created_by_user_id: (raw.created_by_user_id as string | null) ?? null,
      created_by_profile: prof,
    };
  });

  const recentIds = recentList.map((r) => r.id);
  const aggByBatch = new Map<string, StockAgg>();

  if (recentIds.length > 0) {
    const { data: stockRows, error: stErr } = await stockT
      .select(
        "import_batch_id, qualification_status, stock_status, converted_lead_id, current_assignment_id, duplicate_of_stock_id",
      )
      .in("import_batch_id", recentIds);
    if (stErr) {
      throw new Error(stErr.message);
    }
    for (const row of stockRows ?? []) {
      const r = row as {
        import_batch_id: string | null;
        qualification_status: string;
        stock_status: string;
        converted_lead_id: string | null;
        current_assignment_id: string | null;
        duplicate_of_stock_id: string | null;
      };
      accumulateStockRow(
        aggByBatch,
        r.import_batch_id,
        r.qualification_status,
        r.stock_status,
        r.converted_lead_id,
        r.current_assignment_id,
        r.duplicate_of_stock_id,
      );
    }
  }

  const recentBatches: QuantifierBatchPilotageRow[] = recentList.map((b) => {
    const a = aggByBatch.get(b.id) ?? emptyAgg();
    const decided = a.qualified + a.rejected;
    const rate = decided > 0 ? round1((100 * a.qualified) / decided) : null;
    const prof = b.created_by_profile;
    const ownerDisplay =
      batchScope.mode === "all"
        ? prof?.full_name?.trim() || prof?.email?.trim() || null
        : null;
    return {
      batchId: b.id,
      importSource: b.source?.trim() || null,
      sourceLabel: b.source_label?.trim() || null,
      createdAt: b.created_at,
      ceeSheetCode: b.cee_sheet_code?.trim() || null,
      searchSummary: summarizeBatchMetadata(b.metadata_json),
      importedRaw: b.imported_count ?? 0,
      acceptedCount: b.accepted_count ?? 0,
      qualifiedCount: a.qualified,
      rejectedCount: a.rejected,
      pendingWorkCount: a.pendingWork,
      qualificationRatePercent: rate,
      ownerDisplay,
    };
  });

  let lifetime: QuantifierPilotageLifetimeTotals = {
    batchCount: 0,
    importedRawSum: 0,
    qualifiedCount: 0,
    rejectedCount: 0,
    pendingWorkCount: 0,
    avgQualificationRatePercent: null,
  };

  if (batchScope.mode === "own") {
    const allBatchIds = await listImportBatchIdsForQuantificationOwner(supabase, batchScope.userId);
    if (allBatchIds.length === 0) {
      return { recentBatches, lifetime };
    }
    lifetime.batchCount = allBatchIds.length;
    const { data: batchMeta, error: bmErr } = await batchesT.select("imported_count").in("id", allBatchIds);
    if (bmErr) {
      throw new Error(bmErr.message);
    }
    lifetime.importedRawSum = (batchMeta ?? []).reduce(
      (s: number, r: { imported_count: number }) => s + (r.imported_count ?? 0),
      0,
    );
    const { data: allStock, error: asErr } = await stockT
      .select(
        "qualification_status, stock_status, converted_lead_id, current_assignment_id, duplicate_of_stock_id",
      )
      .in("import_batch_id", allBatchIds);
    if (asErr) {
      throw new Error(asErr.message);
    }
    let q = 0;
    let rj = 0;
    let pw = 0;
    for (const row of allStock ?? []) {
      const rr = row as {
        qualification_status: string;
        stock_status: string;
        converted_lead_id: string | null;
        current_assignment_id: string | null;
        duplicate_of_stock_id: string | null;
      };
      if (rr.qualification_status === "qualified") {
        q += 1;
      } else if (rr.qualification_status === "rejected") {
        rj += 1;
      } else if (
        (rr.qualification_status === "pending" || rr.qualification_status === "to_validate") &&
        !rr.converted_lead_id &&
        !rr.current_assignment_id &&
        !rr.duplicate_of_stock_id &&
        (rr.stock_status === "new" || rr.stock_status === "ready")
      ) {
        pw += 1;
      }
    }
    lifetime.qualifiedCount = q;
    lifetime.rejectedCount = rj;
    lifetime.pendingWorkCount = pw;
    const dec = q + rj;
    lifetime.avgQualificationRatePercent = dec > 0 ? round1((100 * q) / dec) : null;
    return { recentBatches, lifetime };
  }

  const [{ count: batchCount, error: cErr }, { data: impMeta, error: imErr }, { data: allStockHub, error: hsErr }] =
    await Promise.all([
      batchesT.select("*", { count: "exact", head: true }),
      batchesT.select("imported_count"),
      stockT
        .select(
          "qualification_status, stock_status, converted_lead_id, current_assignment_id, duplicate_of_stock_id",
        )
        .not("import_batch_id", "is", null),
    ]);
  if (cErr) {
    throw new Error(cErr.message);
  }
  if (imErr) {
    throw new Error(imErr.message);
  }
  if (hsErr) {
    throw new Error(hsErr.message);
  }
  lifetime.batchCount = batchCount ?? 0;
  lifetime.importedRawSum = (impMeta ?? []).reduce(
    (s: number, r: { imported_count: number }) => s + (r.imported_count ?? 0),
    0,
  );
  let hq = 0;
  let hrj = 0;
  let hpw = 0;
  for (const row of allStockHub ?? []) {
    const rr = row as {
      qualification_status: string;
      stock_status: string;
      converted_lead_id: string | null;
      current_assignment_id: string | null;
      duplicate_of_stock_id: string | null;
    };
    if (rr.qualification_status === "qualified") {
      hq += 1;
    } else if (rr.qualification_status === "rejected") {
      hrj += 1;
    } else if (
      (rr.qualification_status === "pending" || rr.qualification_status === "to_validate") &&
      !rr.converted_lead_id &&
      !rr.current_assignment_id &&
      !rr.duplicate_of_stock_id &&
      (rr.stock_status === "new" || rr.stock_status === "ready")
    ) {
      hpw += 1;
    }
  }
  lifetime.qualifiedCount = hq;
  lifetime.rejectedCount = hrj;
  lifetime.pendingWorkCount = hpw;
  const hdec = hq + hrj;
  lifetime.avgQualificationRatePercent = hdec > 0 ? round1((100 * hq) / hdec) : null;

  return { recentBatches, lifetime };
}
