import type { ReactNode } from "react";

import type { AgentLeadGenWorkSummary } from "@/features/lead-generation/queries/get-agent-lead-generation-work-summary";
import type { LgcToCrmConversionRow } from "@/features/lead-generation/queries/get-agent-lgc-to-crm-conversions";

import { SalesAgentLeadGenActivityBlock } from "@/features/dashboard/components/sales-agent-lead-gen-activity-block";
import { SalesAgentLgcCrmProspectsBlock } from "@/features/dashboard/components/sales-agent-lgc-crm-prospects-block";

import { DashboardLayout } from "@/features/dashboards/shared/dashboard-layout";
import type { DashboardPeriod } from "@/features/dashboards/shared/types";

type Props = {
  period: DashboardPeriod;
  /** Libellé détaillé cockpit (ex. plage 30 jours). */
  periodDetailLabel: string;
  /** Boutons affichés à droite du header (ex. file d’appels LGC). */
  extraActions?: ReactNode;
  /** Bloc au-dessus (ex. reprise LGC / file d’appels). */
  topSection?: ReactNode;
  /** Journal LGC sur la période. */
  leadGenActivity?: AgentLeadGenWorkSummary | null;
  /** Conversions stock → fiche `leads` sur la période. */
  lgcCrmConversions: {
    countInRange: number;
    recent: LgcToCrmConversionRow[];
  };
};

/**
 * Accueil agent commercial : uniquement lead gen (stock, activité, conversions) — pas de cockpit pipe CRM.
 */
export function DashboardSalesAgent({
  period,
  periodDetailLabel,
  extraActions,
  topSection,
  leadGenActivity,
  lgcCrmConversions,
}: Props) {
  return (
    <DashboardLayout
      title="Mon workspace du jour"
      description="Votre stock lead gen, le suivi des actions sur les fiches import, et les prospects CRM issus d’une conversion depuis le stock — sans indicateurs pipe (visites, qualifié, signé)."
      period={period}
      actions={extraActions}
    >
      {topSection}
      {leadGenActivity ? (
        <SalesAgentLeadGenActivityBlock summary={leadGenActivity} periodDescription={periodDetailLabel} />
      ) : null}
      <SalesAgentLgcCrmProspectsBlock
        periodDescription={periodDetailLabel}
        countInRange={lgcCrmConversions.countInRange}
        recent={lgcCrmConversions.recent}
      />
    </DashboardLayout>
  );
}
