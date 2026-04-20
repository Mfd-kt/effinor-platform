/** Statut SLA opérationnel (pression / retard). */
export type CommercialSlaStatus = "on_time" | "warning" | "breached";

export const COMMERCIAL_SLA_STATUS_LABELS: Record<CommercialSlaStatus, string> = {
  on_time: "Dans les temps",
  warning: "Sous pression",
  breached: "En retard",
};
