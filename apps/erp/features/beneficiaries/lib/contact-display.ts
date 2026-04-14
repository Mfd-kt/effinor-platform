import type { BeneficiaryRow } from "@/features/beneficiaries/types";

export function beneficiaryContactLabel(
  row: Pick<BeneficiaryRow, "contact_first_name" | "contact_last_name">,
): string | null {
  const parts = [row.contact_first_name, row.contact_last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}
