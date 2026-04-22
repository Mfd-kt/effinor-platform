// TODO: simulator retiré — la recommandation déstrat BAT-TH-142 dépendait du moteur
// de simulation (features/leads/simulator). Stub neutre en attendant la nouvelle source.

import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import type { DynamicAnswers } from "../dynamic/visibility";

export function batTh142BuildingTypeToClientType(_raw: unknown): any {
  return null;
}

export function mergeBatTh142DestratRecommendation(
  _schema: VisitTemplateSchema,
  answers: DynamicAnswers,
): DynamicAnswers {
  return answers;
}
