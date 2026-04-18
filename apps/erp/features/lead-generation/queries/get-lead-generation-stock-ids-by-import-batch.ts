import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const PAGE = 1000;

/**
 * Identifiants stock liés à un batch d’import (ingestion coordinateur ou Maps direct).
 */
export async function getLeadGenerationStockIdsByImportBatch(importBatchId: string): Promise<string[]> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const all: string[] = [];

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await stock
      .select("id")
      .eq("import_batch_id", importBatchId)
      .range(offset, offset + PAGE - 1);

    if (error) {
      throw new Error(`Stock par batch : ${error.message}`);
    }
    const rows = (data ?? []) as { id: string }[];
    for (const r of rows) {
      all.push(r.id);
    }
    if (rows.length < PAGE) {
      break;
    }
  }

  return all;
}
