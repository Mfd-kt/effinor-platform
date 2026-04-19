"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import type { LeadGenerationActionResult } from "@/features/lead-generation/lib/action-result";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import {
  scanLeadGenerationStockDuplicates,
  type ScanLeadGenerationStockDuplicatesResult,
} from "@/features/lead-generation/services/scan-lead-generation-stock-duplicates";

export async function scanLeadGenerationStockDuplicatesAction(): Promise<
  LeadGenerationActionResult<ScanLeadGenerationStockDuplicatesResult>
> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  try {
    const data = await scanLeadGenerationStockDuplicates();
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du scan.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
