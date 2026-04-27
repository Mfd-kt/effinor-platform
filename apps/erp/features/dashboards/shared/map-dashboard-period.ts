import type { CockpitPeriod } from "@/features/dashboard/lib/cockpit-period";

import type { DashboardPeriod } from "./types";

/** Aligne le sélecteur d’accueil (7d / 30d / …) sur les fenêtres du moteur métrique cockpit. */
export function mapDashboardPeriodToCockpitPeriod(p: DashboardPeriod): CockpitPeriod {
  switch (p) {
    case "today":
      return "today";
    case "7d":
      return "week";
    case "30d":
      return "days30";
    case "90d":
      return "month";
    default:
      return "days30";
  }
}
