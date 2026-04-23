import { Clock, Euro, Receipt, Wallet } from "lucide-react";

import { DashboardStub } from "../shared/dashboard-stub";
import type { DashboardPeriod } from "../shared/types";

export function DafDashboard({ period }: { period: DashboardPeriod }) {
  return (
    <DashboardStub
      title="Finance CEE"
      description="Vue DAF : primes en attente, primes payées, CA mensuel et délais de paiement."
      period={period}
      primaryCta={{ label: "Voir primes en attente", href: "/invoices", icon: Wallet }}
      kpis={[
        { label: "Primes en attente", value: "—", icon: Wallet },
        { label: "Primes payées", value: "—", sublabel: "ce mois", icon: Receipt },
        { label: "CA mensuel", value: "—", icon: Euro },
        { label: "Délai moyen paiement", value: "—", sublabel: "jours", icon: Clock },
      ]}
      features={[
        {
          type: "graph",
          title: "Évolution primes payées",
          description: "Line chart mensuel sur 12 mois.",
        },
        {
          type: "graph",
          title: "Répartition par délégataire",
          description: "Donut chart par partenaire CEE.",
        },
        {
          type: "list",
          title: "Dossiers bloqués (payment pending)",
          description: "Tableau triable, alertes sur retards > 30j.",
        },
      ]}
    />
  );
}
