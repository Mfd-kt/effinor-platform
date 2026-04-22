"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import type { LeadGenerationActionResult } from "@/features/lead-generation/lib/action-result";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import {
  dedupeLeadGenerationStockStrictPhoneAndName,
  type DedupeLeadGenerationStockStrictResult,
} from "@/features/lead-generation/services/dedupe-lead-generation-stock-strict-phone-and-name";

export async function dedupeLeadGenerationStockStrictAction(): Promise<
  LeadGenerationActionResult<DedupeLeadGenerationStockStrictResult>
> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  try {
    const data = await dedupeLeadGenerationStockStrictPhoneAndName();
    revalidatePath("/lead-generation");
    revalidatePath("/lead-generation");
    revalidatePath("/lead-generation/stock");
    revalidatePath("/lead-generation/imports");
    revalidatePath("/lead-generation/my-queue");
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du nettoyage.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
