/** Codes stockés en base (`text[]`). */
export const HEATING_MODE_VALUES = ["fioul", "gaz", "pac", "electricite", "autres"] as const;
export type HeatingMode = (typeof HEATING_MODE_VALUES)[number];

export const HEATING_MODE_LABELS: Record<HeatingMode, string> = {
  fioul: "Fioul",
  gaz: "Gaz",
  pac: "PAC",
  electricite: "Électricité",
  autres: "Autres",
};

export const HEATING_MODE_OPTIONS: { value: HeatingMode; label: string }[] = HEATING_MODE_VALUES.map(
  (value) => ({ value, label: HEATING_MODE_LABELS[value] }),
);

const ALLOWED = new Set<string>(HEATING_MODE_VALUES);

/**
 * Normalise `heating_type` venant de la base : `text[]`, parfois encore une seule chaîne (legacy),
 * ou JSON mal typé côté client — évite `value.filter is not a function`.
 */
export function normalizeHeatingModesFromDb(value: unknown): HeatingMode[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is HeatingMode => typeof v === "string" && ALLOWED.has(v));
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if (ALLOWED.has(t)) return [t as HeatingMode];
    return [];
  }
  return [];
}

export function heatingModesToDb(modes: HeatingMode[] | undefined): string[] | null {
  if (!modes?.length) return null;
  return modes;
}

export function formatHeatingModesDisplay(value: unknown): string {
  const modes = normalizeHeatingModesFromDb(value);
  if (!modes.length) return "—";
  return modes.map((v) => HEATING_MODE_LABELS[v]).join(", ");
}
