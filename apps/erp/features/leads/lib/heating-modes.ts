import type { DestratCurrentHeatingModeId } from "@/features/leads/simulator/domain/types";
import {
  DESTRAT_CURRENT_HEATING_MODE_LABELS_FR,
  DESTRAT_CURRENT_HEATING_MODE_VALUES,
} from "@/features/leads/simulator/schemas/simulator.schema";

/**
 * Même liste que le simulateur agent (`currentHeatingMode`) — stockée en `leads.heating_type` (`text[]`).
 * Une seule valeur métier à la fois (UI : select) ; le tableau garde la compatibilité schéma / imports.
 */
export const HEATING_MODE_VALUES = DESTRAT_CURRENT_HEATING_MODE_VALUES;
export type HeatingMode = DestratCurrentHeatingModeId;

export const HEATING_MODE_LABELS: Record<HeatingMode, string> = {
  ...DESTRAT_CURRENT_HEATING_MODE_LABELS_FR,
};

export const HEATING_MODE_OPTIONS: { value: HeatingMode; label: string }[] = HEATING_MODE_VALUES.map(
  (value) => ({ value, label: HEATING_MODE_LABELS[value] }),
);

const ALLOWED = new Set<string>(HEATING_MODE_VALUES);

/** Anciens codes CRM (`fioul`, `gaz`, …) → mode détaillé simulateur. */
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

/**
 * Normalise `heating_type` venant de la base : `text[]`, parfois encore une seule chaîne (legacy),
 * ou JSON mal typé côté client — évite `value.filter is not a function`.
 */
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
