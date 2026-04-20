import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";

/** Recherche GPT quantification : pilotage (hub) ou quantificateur — pas l’agent commercial seul. */
export async function canInitiateLeadGenerationGptResearch(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (await canAccessLeadGenerationHub(access)) {
    return true;
  }
  return canAccessLeadGenerationQuantification(access);
}
