// TODO: cee-workflows / simulator retiré — modes de chauffage inlinés ici en attendant
// le nouveau pipeline simulation. La liste reflète l'ancien `DESTRAT_CURRENT_HEATING_MODE_VALUES`.

export const HEATING_MODE_VALUES = [
  "chaudiere_eau",
  "pac_air_eau",
  "pac_air_air",
  "electrique_direct",
  "rayonnement",
  "mix_air_rayonnement",
  "air_chaud_soufflage",
  "autre_inconnu",
] as const;

export type HeatingMode = (typeof HEATING_MODE_VALUES)[number];

export const HEATING_MODE_LABELS: Record<HeatingMode, string> = {
  chaudiere_eau: "Chaudière (eau chaude)",
  pac_air_eau: "PAC air/eau",
  pac_air_air: "PAC air/air",
  electrique_direct: "Chauffage électrique direct",
  rayonnement: "Rayonnement",
  mix_air_rayonnement: "Mix air/rayonnement",
  air_chaud_soufflage: "Air chaud par soufflage",
  autre_inconnu: "Autre / inconnu",
};

export const HEATING_MODE_OPTIONS: { value: HeatingMode; label: string }[] = HEATING_MODE_VALUES.map(
  (value) => ({ value, label: HEATING_MODE_LABELS[value] }),
);

const ALLOWED = new Set<string>(HEATING_MODE_VALUES);

const LEGACY_HEATING_DB_VALUES: Record<string, HeatingMode> = {
  fioul: "chaudiere_eau",
  gaz: "chaudiere_eau",
  pac: "pac_air_eau",
  pac_air_air: "pac_air_air",
  pac_air_eau: "pac_air_eau",
  electricite: "electrique_direct",
  autres: "autre_inconnu",
};

function mapToCanonical(raw: string): HeatingMode | null {
  if (ALLOWED.has(raw)) return raw as HeatingMode;
  return LEGACY_HEATING_DB_VALUES[raw] ?? null;
}

export function normalizeHeatingModesFromDb(value: unknown): HeatingMode[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const out: HeatingMode[] = [];
    for (const v of value) {
      if (typeof v !== "string") continue;
      const m = mapToCanonical(v.trim());
      if (m) out.push(m);
    }
    return [...new Set(out)];
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    const m = mapToCanonical(t);
    return m ? [m] : [];
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
