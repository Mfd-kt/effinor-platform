import { CalendarDays, Euro, FileSignature, Percent } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function CloserDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Signatures en cours"
      description="Vue closer : RDV, signatures et chiffre d'affaires généré."
      period={period}
      primaryCta={{ label: "Voir mes accords", href: "/quotes", icon: FileSignature }}
      kpis={[
        { label: "RDV cette semaine", value: "—", icon: CalendarDays },
        { label: "Accords signés ce mois", value: "—", icon: FileSignature },
        { label: "Taux de signature", value: "—", sublabel: "RDV → accord", icon: Percent },
        { label: "CA généré", value: "—", sublabel: "ce mois", icon: Euro },
      ]}
      features={[
        {
          type: "graph",
          title: "Mes accords par jour",
          description: "Bar chart sur la période.",
        },
        {
          type: "list",
          title: "RDV de la semaine",
          description: "Vue calendrier compacte.",
        },
        {
          type: "list",
          title: "Accords en attente de signature",
          description: "À relancer (priorité haute).",
        },
      ]}
    />
  );
}
