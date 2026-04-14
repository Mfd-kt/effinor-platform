import type { LeadRow } from "@/features/leads/types";

/**
 * Texte « adresse travaux » aligné sur les 3 champs lead (adresse, CP, ville),
 * comme saisis dans la fiche lead (ligne 1 + ligne 2 CP + ville).
 */
export function formatLeadWorksiteAddressBlock(
  lead: Pick<LeadRow, "worksite_address" | "worksite_postal_code" | "worksite_city">,
): string | undefined {
  const addr = lead.worksite_address?.trim();
  const cityLine = [lead.worksite_postal_code, lead.worksite_city]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (addr && cityLine) {
    return `${addr}\n${cityLine}`;
  }
  if (addr) return addr;
  if (cityLine) return cityLine;
  return undefined;
}
