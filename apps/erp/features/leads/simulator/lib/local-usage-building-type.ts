import type { CeeBuildingType, LocalUsageId } from "@/features/leads/simulator/domain/cee-solution-decision";

/** Déduit le type de bâtiment CEE à partir de l’usage détaillé (une seule saisie côté UI). */
export const BUILDING_TYPE_FROM_LOCAL_USAGE: Record<LocalUsageId, CeeBuildingType> = {
  bureau: "tertiaire",
  commerce: "tertiaire",
  sante: "tertiaire",
  enseignement: "tertiaire",
  hotellerie_restauration: "tertiaire",
  gymnase: "tertiaire",
  atelier: "industriel",
  hall_production: "industriel",
  stockage: "logistique",
  entrepot: "logistique",
  logistique: "logistique",
  reserve: "logistique",
  autre: "autre",
};

export function inferBuildingTypeFromLocalUsage(localUsage: LocalUsageId): CeeBuildingType {
  return BUILDING_TYPE_FROM_LOCAL_USAGE[localUsage];
}
