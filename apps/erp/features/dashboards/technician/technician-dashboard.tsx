import { CalendarRange, Clock, MapPin, Wrench } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function TechnicianDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="VT et planning"
      description="Vue technicien : visites techniques programmées, en attente, et tournée du jour."
      period={period}
      primaryCta={{ label: "Voir mes VT du jour", href: "/technical-visits", icon: Wrench }}
      kpis={[
        { label: "VT programmées", value: "—", icon: Wrench },
        { label: "VT cette semaine", value: "—", icon: CalendarRange },
        { label: "VT en attente", value: "—", icon: Clock },
        { label: "Zone actuelle", value: "—", icon: MapPin },
      ]}
      features={[
        {
          type: "graph",
          title: "Ma tournée de la semaine",
          description: "Timeline horizontale des VT par jour.",
        },
        {
          type: "map",
          title: "Localisation de mes VT",
          description: "Carte si lat/lon disponibles dans les fiches.",
        },
        {
          type: "list",
          title: "VT du jour",
          description: "Ordre, adresse, notes terrain.",
        },
      ]}
    />
  );
}
