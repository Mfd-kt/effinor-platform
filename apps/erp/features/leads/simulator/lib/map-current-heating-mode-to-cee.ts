import type { CeeHeatingKind, DestratCurrentHeatingModeId } from "@/features/leads/simulator/domain/types";
import { DESTRAT_CURRENT_HEATING_MODE_VALUES } from "@/features/leads/simulator/schemas/simulator.schema";

export function isDestratCurrentHeatingModeId(v: string): v is DestratCurrentHeatingModeId {
  return (DESTRAT_CURRENT_HEATING_MODE_VALUES as readonly string[]).includes(v);
}

/** Ancienne saisie 4 boutons → nouveau mode détaillé (meilleur effort). */
export function legacyCeeHeatingKindToCurrentMode(ht: string): DestratCurrentHeatingModeId | "" {
  if (ht === "convectif") return "air_chaud_soufflage";
  if (ht === "radiatif") return "electrique_direct";
  if (ht === "mixte") return "mix_air_rayonnement";
  if (ht === "autre") return "autre_inconnu";
  return "";
}

export function mapDestratCurrentHeatingModeToCeeHeatingKind(mode: DestratCurrentHeatingModeId): CeeHeatingKind {
  switch (mode) {
    case "air_chaud_soufflage":
    case "chaudiere_eau":
    case "pac_air_air":
    case "pac_air_eau":
      return "convectif";
    case "rayonnement":
    case "electrique_direct":
      return "radiatif";
    case "mix_air_rayonnement":
      return "mixte";
    case "autre_inconnu":
      return "autre";
  }
}
