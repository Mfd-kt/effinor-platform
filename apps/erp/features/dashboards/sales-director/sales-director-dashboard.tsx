import { Award, PhoneCall, Target, Users } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function SalesDirectorDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Performance équipe"
      description="Pilotage commercial : agents actifs, conversion, objectifs et coaching."
      period={period}
      primaryCta={{ label: "Voir mes agents", href: "/cockpit", icon: Users }}
      kpis={[
        { label: "Agents actifs", value: "—", sublabel: "ce mois", icon: Users },
        { label: "Leads traités", value: "—", sublabel: "équipe", icon: PhoneCall },
        { label: "Taux conversion équipe", value: "—", sublabel: "lead → accord", icon: Award },
        { label: "Objectif mois", value: "—", sublabel: "% atteint", icon: Target },
      ]}
      features={[
        {
          type: "graph",
          title: "Classement agents",
          description: "Bar chart horizontal — accords signés par agent.",
        },
        {
          type: "graph",
          title: "Évolution appels / accords équipe",
          description: "Lignes superposées sur la période sélectionnée.",
        },
        {
          type: "list",
          title: "Top 5 + Bottom 5",
          description: "Tableau à coacher (à brancher sur queries get-team-performance).",
        },
      ]}
    />
  );
}
