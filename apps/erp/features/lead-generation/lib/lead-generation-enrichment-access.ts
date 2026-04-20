import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

/** Enrichissement automatisé (Firecrawl, lots cockpit, etc.) : pilotage uniquement. */
export async function canRunLeadGenerationStockEnrichment(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  return canAccessLeadGenerationHub(access);
}
