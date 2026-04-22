import { Activity, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

import type { TeamPilotageView } from "../lib/team-pilotage-url";

type Props = {
  activeView: TeamPilotageView;
  suiviHref: string;
  cockpitHref: string;
  analyticsHref: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

const VIEW_DESCRIPTION: Record<TeamPilotageView, string> = {
  suivi:
    "Vue direction : performance des quantificateurs, qualité des lots et retours commerciaux (période filtrable).",
  cockpit:
    "Vue temps réel du pipeline lead generation : volumes, retards, équipe et dispatch.",
  analytics:
    "Vue analytique consolidée : acquisition, qualité du stock, exécution commerciale, conversion et automatisations.",
};

export function LeadGenerationTeamPilotageShell({
  activeView,
  suiviHref,
  cockpitHref,
  analyticsHref,
  headerActions,
  children,
}: Props) {
  const tabClass = (active: boolean) =>
    cn(
      "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
    );

  const iconClass = (active: boolean) =>
    cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground");

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Pilotage" description={VIEW_DESCRIPTION[activeView]} actions={headerActions} />

      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/40 p-1"
        aria-label="Vues pilotage"
      >
        <Link href={suiviHref} className={tabClass(activeView === "suivi")} replace scroll={false}>
          <Users className={iconClass(activeView === "suivi")} aria-hidden />
          Suivi quantificateurs
        </Link>
        <Link href={cockpitHref} className={tabClass(activeView === "cockpit")} replace scroll={false}>
          <Activity className={iconClass(activeView === "cockpit")} aria-hidden />
          Cockpit temps réel
        </Link>
        <Link href={analyticsHref} className={tabClass(activeView === "analytics")} replace scroll={false}>
          <BarChart3 className={iconClass(activeView === "analytics")} aria-hidden />
          Analytics
        </Link>
      </nav>

      {children}
    </div>
  );
}
