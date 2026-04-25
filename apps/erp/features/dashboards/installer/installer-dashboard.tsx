import { CalendarDays, Hammer, Package } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function InstallerDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Planning pose"
      description="Vue installateur : installations programmées, planning et matériel disponible."
      period={period}
      primaryCta={{
        label: "Voir installations du jour",
        href: "/installations",
        icon: Hammer,
      }}
      kpis={[
        { label: "Installations programmées", value: "—", icon: Hammer },
        { label: "Cette semaine", value: "—", icon: CalendarDays },
        { label: "Matériel disponible", value: "—", icon: Package },
      ]}
      features={[
        {
          type: "graph",
          title: "Planning 14 prochains jours",
          description: "Timeline horizontale par jour / par poseur.",
        },
        {
          type: "list",
          title: "Installations du jour",
          description: "Adresse, créneau, matériel à embarquer.",
        },
      ]}
    />
  );
}
