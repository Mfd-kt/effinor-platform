import type { LeadRow } from "@/features/leads/types";

/** Prénom + nom, ou repli sur `contact_name`. */
export function contactDisplayName(
  row: Pick<LeadRow, "first_name" | "last_name" | "contact_name">,
): string | null {
  const parts = [row.first_name, row.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  const c = row.contact_name?.trim();
  return c || null;
}

/** Affichage courant : civilité + identité (ex. « Mme Dupont »). */
export function contactSalutationLine(
  row: Pick<LeadRow, "civility" | "first_name" | "last_name" | "contact_name">,
): string | null {
  const base = contactDisplayName(row);
  if (!base) return null;
  const civ = row.civility?.trim();
  if (!civ) return base;
  return `${civ} ${base}`;
}

/** Affichage liste (poste agent, files) : civilité + nom déjà dissocié. */
export function formatCivilityNamePair(
  civility: string | null | undefined,
  nameWithoutCivility: string | null | undefined,
): string {
  const n = nameWithoutCivility?.trim() ?? "";
  const c = civility?.trim() ?? "";
  if (!n && !c) return "";
  if (!c) return n;
  if (!n) return c;
  return `${c} ${n}`;
}
