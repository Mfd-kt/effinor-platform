import { CheckSquare, FileWarning, FolderOpen, ScrollText } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function AdminAgentDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Dossiers CEE"
      description="Vue agent administratif : montage des dossiers, documents bénéficiaires, dépôts."
      period={period}
      primaryCta={{
        label: "Voir dossiers urgents",
        href: "/agent-operations",
        icon: FolderOpen,
      }}
      kpis={[
        { label: "Dossiers à monter", value: "—", icon: FolderOpen },
        { label: "Docs manquants", value: "—", icon: FileWarning },
        { label: "Dépôts ce mois", value: "—", icon: ScrollText },
        { label: "Taux de validation", value: "—", icon: CheckSquare },
      ]}
      features={[
        {
          type: "list",
          title: "Dossiers priorité haute",
          description: "Triés par échéance, avec deadline dépôt délégataire.",
        },
        {
          type: "list",
          title: "Docs bénéficiaires en attente",
          description: "Pré-triés par âge de la demande.",
        },
      ]}
    />
  );
}
