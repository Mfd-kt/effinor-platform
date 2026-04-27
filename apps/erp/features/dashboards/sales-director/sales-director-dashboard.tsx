import Link from "next/link";
import {
  BarChart3,
  FileSignature,
  LayoutList,
  PhoneCall,
  Target,
  Wrench,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";
import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessCockpitRoute } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

import { DashboardStub } from "../shared/dashboard-stub";
import { DashboardLayout, KpiGrid } from "../shared/dashboard-layout";
import { KpiStatCard } from "../shared/kpi-stat-card";
import { mapDashboardPeriodToCockpitPeriod } from "../shared/map-dashboard-period";
import { computeTrend, type DashboardPeriod } from "../shared/types";

type Props = {
  access: AccessContext;
  period: DashboardPeriod;
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

/**
 * Accueil directeur commercial : KPIs issus de la base (même logique de périmètre que le cockpit) + raccourcis vers le pilotage.
 */
export async function SalesDirectorDashboard({ access, period }: Props) {
  if (access.kind !== "authenticated") {
    return null;
  }

  const cockpitPeriod = mapDashboardPeriodToCockpitPeriod(period);
  const showCockpit = await canAccessCockpitRoute(access);

  let m: Awaited<ReturnType<typeof getDashboardMetrics>>;
  try {
    m = await getDashboardMetrics(access, cockpitPeriod);
  } catch (err) {
    console.error("[SalesDirectorDashboard] getDashboardMetrics", err);
    return (
      <DashboardStub
        title="Performance équipe"
        description="Pilotage commercial : chargez de nouveau la page si le problème persiste."
        period={period}
        primaryCta={showCockpit ? { label: "Ouvrir le cockpit", href: "/cockpit", icon: BarChart3 } : undefined}
        roadmapNote="Impossible de charger les indicateurs pour l’instant (erreur serveur). Les raccourcis ci-dessous restent disponibles."
        kpis={[
          { label: "Leads créés", value: "—", sublabel: "période", icon: Target },
          { label: "Qualifiés", value: "—", icon: Target },
          { label: "Rappels à traiter", value: "—", icon: PhoneCall },
          { label: "Visites techniques", value: "—", icon: Wrench },
        ]}
        features={[
          {
            type: "cta",
            title: "Cockpit & arbitrage",
            description: "Vue consolidée CEE, équipes et tendances.",
          },
        ]}
      />
    );
  }

  const tLeads = computeTrend(
    m.periodCounts.leadsCreated,
    m.previousPeriodCounts.leadsCreated,
  );

  return (
    <DashboardLayout
      title="Performance équipe"
      description="Vue directeur commercial : activité commerciale et terrain sur votre périmètre, pour la fenêtre choisie. Poursuivez l’analyse dans le cockpit ou le CRM."
      period={period}
      actions={
        <>
          {showCockpit ? (
            <Link
              href="/cockpit"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <BarChart3 className="size-3.5" aria-hidden />
              Cockpit
            </Link>
          ) : null}
          <Link
            href="/leads"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <LayoutList className="size-3.5" aria-hidden />
            CRM
          </Link>
        </>
      }
    >
      <Card className="border-border/80 bg-muted/20">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Fenêtre :</span>{" "}
            {m.periodDetailLabel} · {m.comparisonPeriodLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/lead-generation/management"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Lead generation
            </Link>
            <Link
              href="/commercial-callbacks"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Rappels commerciaux
            </Link>
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={4}>
        <KpiStatCard
          label="Leads créés"
          value={fmt(m.leadsTotal)}
          sublabel="sur la période"
          icon={Target}
          trend={tLeads}
        />
        <KpiStatCard
          label="Qualifiés"
          value={fmt(m.leadsQualified)}
          sublabel="créés sur la période"
          icon={FileSignature}
        />
        <KpiStatCard
          label="Rappels (période)"
          value={fmt(m.leadsCallbackDue)}
          sublabel="rappels planifiés"
          icon={PhoneCall}
        />
        <KpiStatCard
          label="Visites techniques"
          value={fmt(m.vtTotal)}
          sublabel="créées sur la période"
          icon={Wrench}
        />
      </KpiGrid>

      {m.recentLeads.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Derniers leads (période)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-border/80 text-sm">
              {m.recentLeads.map((L) => (
                <li key={L.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link
                    href={`/leads/${L.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {L.company_name || "—"}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(L.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    · {L.lead_status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </DashboardLayout>
  );
}
