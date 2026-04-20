/**
 * Pipeline commercial sur `lead_generation_assignments` (hors outcome terminal).
 * Seul `new` compte dans le « stock neuf » pour plafond / réinjection.
 */
export type CommercialPipelineStatus = "new" | "contacted" | "follow_up" | "converted";

/** Seul statut compté dans le stock actif agent (plafond, réinjection, métriques alignées). */
export const COMMERCIAL_PIPELINE_ACTIVE_STOCK_STATUS = "new" as const satisfies CommercialPipelineStatus;

export const COMMERCIAL_PIPELINE_STATUS_LABELS: Record<CommercialPipelineStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté / En action",
  follow_up: "À rappeler",
  converted: "Converti",
};
