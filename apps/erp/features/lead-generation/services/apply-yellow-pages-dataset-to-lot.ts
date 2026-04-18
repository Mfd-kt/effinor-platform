import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationRawStockInput, LeadGenerationSourceChannel } from "../domain/raw-input";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { mapYellowPagesApifyItem } from "../apify/map-yellow-pages-apify-item";
import { getApifyDatasetItems, getApifyToken } from "../apify/client";
import { mergeRawStockPair, multiSourceMergeKey } from "../lib/multi-source-merge";
import { combinedSourceSignalScore } from "../lib/multi-source-source-signal";
import { lgTable } from "../lib/lg-db";
import { prepareLeadGenerationStockRow } from "../lib/prepare-lead-generation-stock-row";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";

export type ApplyYellowPagesDatasetToLotResult = {
  patchedCount: number;
  unmatchedYellowRows: number;
};

function stockRowToRaw(s: LeadGenerationStockRow): LeadGenerationRawStockInput {
  const ch = (s.source_channels ?? []) as LeadGenerationSourceChannel[];
  return {
    source: s.source?.trim() || "google_maps",
    source_external_id: s.source_external_id,
    company_name: s.company_name,
    phone: s.phone,
    email: s.email,
    website: s.website,
    address: s.address,
    postal_code: s.postal_code,
    city: s.city,
    category: s.category,
    sub_category: s.sub_category,
    siret: s.siret,
    headcount_range: s.headcount_range,
    decision_maker_name: s.decision_maker_name ?? undefined,
    decision_maker_role: s.decision_maker_role ?? undefined,
    linkedin_url: s.linkedin_url ?? undefined,
    has_linkedin: Boolean(s.has_linkedin),
    has_decision_maker: Boolean(s.has_decision_maker),
    source_channels: ch.length > 0 ? ch : ["google_maps"],
    source_signal_score: s.source_signal_score ?? 0,
    extra_payload: {},
  };
}

/**
 * Après import Apify Pages Jaunes : enrichit les fiches du lot coordinateur (sans ré-ingestion complète).
 */
export async function applyYellowPagesDatasetToLot(input: {
  coordinatorBatchId: string;
  yellowPagesBatchId: string;
}): Promise<ApplyYellowPagesDatasetToLotResult> {
  const { coordinatorBatchId, yellowPagesBatchId } = input;
  const ypBatch = await getLeadGenerationImportBatchById(yellowPagesBatchId);
  if (!ypBatch || ypBatch.status !== "completed") {
    return { patchedCount: 0, unmatchedYellowRows: 0 };
  }
  const ds = ypBatch.external_dataset_id?.trim();
  if (!ds) {
    return { patchedCount: 0, unmatchedYellowRows: 0 };
  }

  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const PAGE = 1000;
  const stockByKey = new Map<string, LeadGenerationStockRow>();

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await stock.select("*").eq("import_batch_id", coordinatorBatchId).range(offset, offset + PAGE - 1);
    if (error) {
      throw new Error(`Stock lot : ${error.message}`);
    }
    const rows = (data ?? []) as LeadGenerationStockRow[];
    for (const row of rows) {
      const raw = stockRowToRaw(row);
      const k = multiSourceMergeKey(raw);
      if (k && !stockByKey.has(k)) {
        stockByKey.set(k, row);
      }
    }
    if (rows.length < PAGE) break;
  }

  const token = getApifyToken();
  const items = await getApifyDatasetItems(token, ds);
  let patchedCount = 0;
  let unmatchedYellowRows = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < items.length; i++) {
    const mapped = mapYellowPagesApifyItem(items[i], i);
    if (!mapped.ok) continue;
    const yp = mapped.row;
    const key = multiSourceMergeKey(yp);
    const target = stockByKey.get(key);
    if (!target) {
      unmatchedYellowRows += 1;
      continue;
    }
    const base = stockRowToRaw(target);
    const merged = mergeRawStockPair(base, yp);
    const chans = new Set<LeadGenerationSourceChannel>([
      ...((target.source_channels ?? []) as LeadGenerationSourceChannel[]),
      "yellow_pages",
    ]);
    merged.source_channels = [...chans];
    merged.source_signal_score = combinedSourceSignalScore(merged.source_channels);
    const prepared = prepareLeadGenerationStockRow(merged);
    const dm = prepared.decision_maker_name?.trim();

    const patch: Record<string, unknown> = {
      company_name: prepared.company_name,
      normalized_company_name: prepared.normalized_company_name,
      phone: prepared.phone,
      normalized_phone: prepared.normalized_phone,
      email: prepared.email,
      normalized_email: prepared.normalized_email,
      website: prepared.website,
      normalized_domain: prepared.normalized_domain,
      address: prepared.address,
      postal_code: prepared.postal_code,
      city: prepared.city,
      category: prepared.category,
      sub_category: prepared.sub_category,
      siret: prepared.siret,
      headcount_range: prepared.headcount_range,
      phone_status: prepared.phone_status,
      email_status: prepared.email_status,
      website_status: prepared.website_status,
      target_score: Math.max(target.target_score ?? 0, prepared.target_score),
      has_linkedin: prepared.has_linkedin,
      has_decision_maker: prepared.has_decision_maker || Boolean(dm),
      source_signal_score: prepared.source_signal_score,
      source_channels: prepared.source_channels,
      linkedin_url: prepared.linkedin_url,
      decision_maker_name: prepared.decision_maker_name,
      decision_maker_role: prepared.decision_maker_role,
      updated_at: now,
    };

    await stock.update(patch as never).eq("id", target.id);
    patchedCount += 1;
  }

  return { patchedCount, unmatchedYellowRows };
}
