import Link from "next/link";
import { CheckCircle2, ListChecks, UserPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { getCockpitPeriodDetailLabel, getCockpitPeriodRange } from "@/features/dashboard/lib/cockpit-period";
import { getAgentLeadGenWorkSummary } from "@/features/lead-generation/queries/get-agent-lead-generation-work-summary";
import { getAgentLgcToCrmConversions } from "@/features/lead-generation/queries/get-agent-lgc-to-crm-conversions";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { canViewAgentLeadGenWorkHistory } from "@/lib/auth/lead-generation-work-view";
import type { AccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

import { SalesAgentLeadGenResume } from "@/features/dashboard/components/sales-agent-lead-gen-resume";
import { DashboardStub } from "../shared/dashboard-stub";
import { mapDashboardPeriodToCockpitPeriod } from "../shared/map-dashboard-period";
import { DashboardSalesAgent } from "@/features/dashboard/components/dashboard-sales-agent";
import type { DashboardPeriod } from "../shared/types";

type Props = {
  access: AccessContext;
  period: DashboardPeriod;
};

/**
 * Accueil agent commercial : lead gen uniquement (stock, activité, conversions) — pas de métriques pipe CRM.
 */
export async function SalesAgentDashboard({ access, period }: Props) {
  if (access.kind !== "authenticated") {
    return null;
  }

  let queue: Awaited<ReturnType<typeof getMyLeadGenerationQueue>> = [];
  let leadGenActivity: Awaited<ReturnType<typeof getAgentLeadGenWorkSummary>> | null = null;
  let lgcCrmConversions: Awaited<ReturnType<typeof getAgentLgcToCrmConversions>> = {
    countInRange: 0,
    recent: [],
  };
  const now = new Date();
  const cockpitPeriod = mapDashboardPeriodToCockpitPeriod(period);
  const currentRange = getCockpitPeriodRange(cockpitPeriod, now);
  const periodDetailLabel = getCockpitPeriodDetailLabel(cockpitPeriod, now);

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("[SalesAgentDashboard] createClient", err);
    return (
      <DashboardStub
        title="Mon workspace du jour"
        description="La session serveur n’a pas pu s’établir. Rechargez la page."
        period={period}
        primaryCta={{ label: "Lancer ma session d'appels", href: "/lead-generation/my-queue", icon: CheckCircle2 }}
        roadmapNote="Connexion base indisponible. Réessayez dans un instant."
        kpis={[
          { label: "Fiches en file", value: "—", icon: ListChecks },
          { label: "Conversions période", value: "—", sublabel: "stock → CRM", icon: UserPlus },
        ]}
        features={[
          { type: "cta", title: "File d'appels", description: "Reprendre la prospection LGC." },
        ]}
      />
    );
  }

  try {
    queue = await getMyLeadGenerationQueue(access.userId);
  } catch (qErr) {
    console.error("[SalesAgentDashboard] getMyLeadGenerationQueue", qErr);
  }

  if (canViewAgentLeadGenWorkHistory(access, access.userId)) {
    try {
      leadGenActivity = await getAgentLeadGenWorkSummary(
        supabase,
        access.userId,
        currentRange.startIso,
        currentRange.endIso,
        { queueItems: queue },
      );
    } catch (lgErr) {
      console.error("[SalesAgentDashboard] getAgentLeadGenWorkSummary", lgErr);
    }
  }

  try {
    lgcCrmConversions = await getAgentLgcToCrmConversions(
      supabase,
      access.userId,
      currentRange.startIso,
      currentRange.endIso,
    );
  } catch (cErr) {
    console.error("[SalesAgentDashboard] getAgentLgcToCrmConversions", cErr);
  }

  return (
    <DashboardSalesAgent
      period={period}
      periodDetailLabel={periodDetailLabel}
      leadGenActivity={leadGenActivity}
      lgcCrmConversions={lgcCrmConversions}
      topSection={<SalesAgentLeadGenResume userId={access.userId} preloadedQueue={queue} />}
      extraActions={
        <Link
          href="/lead-generation/my-queue"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <CheckCircle2 className="size-3.5" aria-hidden />
          Lancer ma session
        </Link>
      }
    />
  );
}
