import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

import type { TeamPilotageView } from "../lib/team-pilotage-url";

type Props = {
  activeView: TeamPilotageView;
  suiviHref: string;
  cockpitHref: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function LeadGenerationTeamPilotageShell({
  activeView,
  suiviHref,
  cockpitHref,
  headerActions,
  children,
}: Props) {
  const tabClass = (active: boolean) =>
    cn(
      "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
    );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-10">
      <PageHeader
        title="Pilotage équipe"
        description={
          activeView === "cockpit"
            ? "Vue temps réel du pipeline lead generation : volumes, retards, équipe et dispatch."
            : "Vue direction : performance des quantificateurs, qualité des lots et retours commerciaux (période filtrable)."
        }
        actions={headerActions}
      />

      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/40 p-1"
        aria-label="Vues pilotage équipe"
      >
        <Link href={suiviHref} className={tabClass(activeView === "suivi")} replace scroll={false}>
          Suivi quantificateurs
        </Link>
        <Link href={cockpitHref} className={tabClass(activeView === "cockpit")} replace scroll={false}>
          Cockpit temps réel
        </Link>
      </nav>

      {children}
    </div>
  );
}
