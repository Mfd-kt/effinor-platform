import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import {
  computeDestratEconomics,
  resolveDestratModelFromHeightAndSelection,
} from "@/features/leads/simulator/domain/simulator";
import type { ClientType, HeatingMode } from "@/features/leads/simulator/domain/types";

import type { DynamicAnswers } from "../dynamic/visibility";

function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Profil air / heures comme le simulateur selon le type de bâtiment VT BAT-TH-142. */
export function batTh142BuildingTypeToClientType(raw: unknown): ClientType {
  const v = typeof raw === "string" ? raw : "";
  if (v === "hall_production" || v === "atelier") {
    return "Site industriel / logistique";
  }
  return "Tertiaire";
}

function batTh142HeatingEnergyToMode(raw: unknown): HeatingMode {
  const v = typeof raw === "string" ? raw : "";
  if (v === "gaz" || v === "fioul" || v === "bois" || v === "elec" || v === "pac") {
    return v;
  }
  return "gaz";
}

function schemaHasBatTh142RecommendationFields(schema: VisitTemplateSchema): boolean {
  if (schema.template_key !== "BAT-TH-142") return false;
  return schema.sections.some((s) =>
    s.fields.some((f) => f.id === "recommended_model" || f.id === "recommended_qty"),
  );
}

/**
 * Met à jour `recommended_model` et `recommended_qty` comme le simulateur (volume × taux de renouvellement / débit modèle).
 * Utilise aussi le nombre de zones comme plancher (au moins un appareil par zone).
 */
export function mergeBatTh142DestratRecommendation(
  schema: VisitTemplateSchema,
  answers: DynamicAnswers,
): DynamicAnswers {
  if (!schemaHasBatTh142RecommendationFields(schema)) {
    return answers;
  }

  const height = toFiniteNumber(answers.destrat_avg_height_m);
  const surface = toFiniteNumber(answers.destrat_total_surface_m2);
  const zones = toFiniteNumber(answers.destrat_zone_count);

  if (height == null || surface == null || zones == null || height <= 0 || surface <= 0 || zones < 1) {
    return {
      ...answers,
      recommended_model: undefined,
      recommended_qty: undefined,
    };
  }

  const clientType = batTh142BuildingTypeToClientType(answers.building_type);
  const heatingMode = batTh142HeatingEnergyToMode(answers.heating_energy);
  const model = resolveDestratModelFromHeightAndSelection(height, answers.recommended_model as string | undefined);

  const econ = computeDestratEconomics({
    clientType,
    heightM: height,
    surfaceM2: surface,
    heatingMode,
    model,
    consigne: null,
  });

  const qty = Math.max(econ.neededDestrat, Math.round(zones));

  return {
    ...answers,
    recommended_model: model,
    recommended_qty: qty,
  };
}
