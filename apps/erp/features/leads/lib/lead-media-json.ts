import type { Json } from "@/types/database.types";

export function stringArrayFromLeadJson(value: Json | null | undefined): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function formatMediaListForDisplay(value: Json | null | undefined): string {
  const arr = stringArrayFromLeadJson(value);
  return arr.length ? arr.join("\n") : "—";
}
