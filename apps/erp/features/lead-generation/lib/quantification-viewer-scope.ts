import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

/** Vue globale (hub / manager CEE) vs lots créés par le quantificateur connecté. */
export type QuantificationImportBatchScope = { mode: "all" } | { mode: "own"; userId: string };

export async function resolveQuantificationImportBatchScope(
  access: AccessContext,
): Promise<QuantificationImportBatchScope | null> {
  if (access.kind !== "authenticated") {
    return null;
  }
  if (await canAccessLeadGenerationHub(access)) {
    return { mode: "all" };
  }
  return { mode: "own", userId: access.userId };
}
