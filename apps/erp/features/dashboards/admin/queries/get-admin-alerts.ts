import "server-only";

import type { DashboardAlert } from "../../shared/types";

/**
 * MOCK — Alertes système-wide pour Admin / Super_admin.
 * À brancher sur les checks réels : quota téléphones, SLA dépassés, agents inactifs >7j…
 */
export async function getAdminAlerts(): Promise<DashboardAlert[]> {
  return [
    {
      id: "phone-quota",
      severity: "warning",
      title: "Quota téléphones presque atteint",
      description: "9 200 / 10 000 numéros LeBonCoin consommés ce mois.",
      href: "/admin/quotas",
      ctaLabel: "Gérer",
    },
    {
      id: "agents-idle",
      severity: "info",
      title: "3 agents commerciaux inactifs depuis 7 jours",
      description: "Aucun appel ni mise à jour de file enregistré.",
      href: "/admin/users?filter=idle",
      ctaLabel: "Voir",
    },
  ];
}
