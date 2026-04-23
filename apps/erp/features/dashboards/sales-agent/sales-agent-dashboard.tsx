import { CheckCircle2, PhoneCall, PhoneForwarded, Target, TrendingUp } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function SalesAgentDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Mon workspace du jour"
      description="Vue agent commercial : activité personnelle, rappels et objectifs du jour."
      period={period}
      primaryCta={{
        label: "Lancer ma session d'appels",
        href: "/lead-generation/my-queue",
        icon: CheckCircle2,
      }}
      kpis={[
        { label: "Mes appels aujourd'hui", value: "—", icon: PhoneCall },
        { label: "Mes rappels du jour", value: "—", icon: PhoneForwarded },
        { label: "Mon taux de conversion", value: "—", sublabel: "30 derniers jours", icon: TrendingUp },
        { label: "Objectif", value: "—", sublabel: "% atteint", icon: Target },
      ]}
      features={[
        {
          type: "graph",
          title: "Mes résultats — 7 derniers jours",
          description: "Line chart appels / accords / signés.",
        },
        {
          type: "list",
          title: "Prochains rappels (top 5)",
          description: "Cliquables vers la fiche lead.",
        },
        {
          type: "list",
          title: "Mes accords en cours (top 5)",
          description: "Statut + relance attendue.",
        },
      ]}
    />
  );
}
