import { z } from "zod";

import { LEAD_CIVILITY_VALUES } from "@/features/leads/lib/civility-options";

import {
  SIMULATOR_CONSTANTS,
  getSuggestedModel,
} from "@/features/leads/simulator/domain/simulator";
import type {
  CeeBuildingType,
  CeeHeatingKind,
  CeeNeed,
  ClientType,
  DestratCurrentHeatingModeId,
  DestratModel,
  LocalUsageId,
  SimulatorInput,
} from "@/features/leads/simulator/domain/types";

export const CLIENT_TYPE_VALUES = [
  "Site industriel / logistique",
  "Collectivité",
  "Tertiaire",
] as const satisfies readonly ClientType[];

export const HEATING_MODE_VALUES = [
  "bois",
  "gaz",
  "fioul",
  "elec",
  "pac",
] as const;

export const HEATING_MODE_LABELS_FR: Record<(typeof HEATING_MODE_VALUES)[number], string> = {
  bois: "Bois (Granulés vrac)",
  gaz: "Gaz Naturel",
  fioul: "Fioul Domestique",
  elec: "Électricité (Directe)",
  pac: "Pompe à chaleur",
};

export function formatHeatingModeLabelFr(mode: (typeof HEATING_MODE_VALUES)[number] | ""): string {
  return mode ? HEATING_MODE_LABELS_FR[mode] : "";
}

export const DESTRAT_MODEL_VALUES = [
  "teddington_ds3",
  "teddington_ds7",
  "generfeu",
] as const satisfies readonly DestratModel[];

export const CEE_BUILDING_TYPE_VALUES = ["tertiaire", "industriel", "logistique", "autre"] as const satisfies readonly CeeBuildingType[];

export const CEE_HEATING_TYPE_VALUES = ["convectif", "radiatif", "mixte", "autre"] as const satisfies readonly CeeHeatingKind[];

export const CEE_NEED_VALUES = ["chauffage", "chauffage_ecs", "ecs_seule"] as const satisfies readonly CeeNeed[];

export const LOCAL_USAGE_VALUES = [
  "bureau",
  "commerce",
  "sante",
  "enseignement",
  "hotellerie_restauration",
  "atelier",
  "hall_production",
  "gymnase",
  "stockage",
  "entrepot",
  "logistique",
  "reserve",
  "autre",
] as const satisfies readonly LocalUsageId[];

export const LOCAL_USAGE_LABELS_FR: Record<LocalUsageId, string> = {
  bureau: "Bureau",
  commerce: "Commerce",
  sante: "Santé",
  enseignement: "Enseignement",
  hotellerie_restauration: "Hôtellerie / restauration",
  atelier: "Atelier",
  hall_production: "Hall de production",
  gymnase: "Gymnase",
  stockage: "Stockage",
  entrepot: "Entrepôt",
  logistique: "Logistique",
  reserve: "Réserve",
  autre: "Autre",
};

export const CEE_BUILDING_TYPE_LABELS_FR: Record<CeeBuildingType, string> = {
  tertiaire: "Tertiaire",
  industriel: "Industriel",
  logistique: "Logistique",
  autre: "Autre",
};

export const CEE_HEATING_LABELS_FR: Record<CeeHeatingKind, string> = {
  convectif: "Convectif",
  radiatif: "Radiatif",
  mixte: "Mixte",
  autre: "Autre",
};

/** Saisie agent : mode de chauffage actuel (liste unique) → mappé vers `CeeHeatingKind` + €/kWh. */
export const DESTRAT_CURRENT_HEATING_MODE_VALUES = [
  "air_chaud_soufflage",
  "rayonnement",
  "mix_air_rayonnement",
  "chaudiere_eau",
  "electrique_direct",
  "pac_air_air",
  "pac_air_eau",
  "autre_inconnu",
] as const satisfies readonly DestratCurrentHeatingModeId[];

export type { DestratCurrentHeatingModeId };

export const DESTRAT_CURRENT_HEATING_MODE_LABELS_FR: Record<DestratCurrentHeatingModeId, string> = {
  air_chaud_soufflage: "Air chaud / soufflage d'air (aérotherme, rooftop, CTA)",
  rayonnement: "Chauffage par rayonnement (tube radiant, panneaux)",
  mix_air_rayonnement: "Mix air chaud + rayonnement",
  chaudiere_eau: "Chaudière (radiateurs ou réseau eau chaude)",
  electrique_direct: "Chauffage électrique direct",
  pac_air_air: "Pompe à chaleur air / air",
  pac_air_eau: "Pompe à chaleur air / eau",
  autre_inconnu: "Autre / je ne sais pas",
};

export const CEE_NEED_LABELS_FR: Record<CeeNeed, string> = {
  chauffage: "Chauffage",
  chauffage_ecs: "Chauffage + ECS",
  ecs_seule: "ECS seule",
};

function toNumberWithBounds(min: number, max: number, minMsg: string, maxMsg: string) {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
    const n = Number(String(val).trim().replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }, z.number().min(min, minMsg).max(max, maxMsg));
}

export const SimulatorInputSchema = z.object({
  isHeated: z.boolean(),
  buildingType: z.enum(CEE_BUILDING_TYPE_VALUES),
  localUsage: z.enum(LOCAL_USAGE_VALUES),
  heightM: toNumberWithBounds(2.5, 15, "Hauteur minimum 2,5 m.", "Hauteur maximum 15 m."),
  surfaceM2: toNumberWithBounds(800, 10000, "Surface minimum 800m².", "Surface maximum 10 000m²."),
  heatingType: z.enum(CEE_HEATING_TYPE_VALUES),
  currentHeatingMode: z.enum(DESTRAT_CURRENT_HEATING_MODE_VALUES).optional().nullable(),
  model: z.enum(DESTRAT_MODEL_VALUES),
  consigne: z.string().max(300).optional().nullable(),
});

export const SimulateLeadSchema = SimulatorInputSchema;

export const SimulateAndCreateLeadSchema = SimulatorInputSchema.extend({
  ceeSheetId: z.string().uuid().optional(),
  companyName: z.string().min(1, "Société obligatoire.").max(500),
  civility: z.enum(LEAD_CIVILITY_VALUES).optional().default(""),
  contactName: z.string().min(1, "Nom contact obligatoire.").max(200),
  phone: z.string().min(1, "Téléphone obligatoire.").max(50),
  callbackAt: z.string().min(1, "Date et heure de rappel obligatoires."),
  email: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Email invalide." }),
  jobTitle: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  source: z.literal("cold_call").optional(),
});

export type SimulateLeadInput = z.input<typeof SimulateLeadSchema>;
export type SimulateAndCreateLeadInput = z.input<typeof SimulateAndCreateLeadSchema>;

export function normalizeSimulatorInput(raw: z.infer<typeof SimulatorInputSchema>): SimulatorInput {
  const clampedHeight = Math.max(
    SIMULATOR_CONSTANTS.HEIGHT_MIN,
    Math.min(SIMULATOR_CONSTANTS.HEIGHT_MAX, raw.heightM),
  );
  return {
    ...raw,
    isClosed: true,
    buildingAgeMoreThan2Years: true,
    setpointTemp: 19,
    need: "chauffage" satisfies CeeNeed,
    model: raw.model ?? getSuggestedModel(clampedHeight),
  };
}
