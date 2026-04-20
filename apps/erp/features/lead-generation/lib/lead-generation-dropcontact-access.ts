import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { isLeadGenerationStockInQuantificationQueue } from "./is-lead-generation-quantification-candidate";

/** Dropcontact : pilotage (hub) ou quantificateur — jamais l’agent commercial seul. */
export async function canInitiateLeadGenerationDropcontact(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (await canAccessLeadGenerationHub(access)) {
    return true;
  }
  return canAccessLeadGenerationQuantification(access);
}

export function canApplyLeadGenerationDropcontactToStock(
  stock: LeadGenerationStockRow,
  ctx: { hub: boolean; quantifier: boolean },
): boolean {
  if (ctx.hub) {
    return true;
  }
  if (!ctx.quantifier) {
    return false;
  }
  return isLeadGenerationStockInQuantificationQueue(stock);
}
