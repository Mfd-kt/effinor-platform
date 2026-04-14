import type { LeadRow } from "@/features/leads/types";

/** Siège + chantier renseignés (non vides) — prérequis pour ouvrir une VT depuis le lead. */
export function leadAddressesComplete(lead: Pick<
  LeadRow,
  | "head_office_address"
  | "head_office_postal_code"
  | "head_office_city"
  | "worksite_address"
  | "worksite_postal_code"
  | "worksite_city"
>): boolean {
  const f = (s: string) => s.trim().length > 0;
  return (
    f(lead.head_office_address) &&
    f(lead.head_office_postal_code) &&
    f(lead.head_office_city) &&
    f(lead.worksite_address) &&
    f(lead.worksite_postal_code) &&
    f(lead.worksite_city)
  );
}
