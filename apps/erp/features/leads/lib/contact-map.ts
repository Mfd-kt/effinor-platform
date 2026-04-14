import type { LeadRow } from "@/features/leads/types";

export function contactDisplayName(
  row: Pick<LeadRow, "first_name" | "last_name">,
): string | null {
  const parts = [row.first_name, row.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}
