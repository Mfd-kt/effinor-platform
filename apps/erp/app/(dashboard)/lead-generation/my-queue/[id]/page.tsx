import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConvertMyLeadAssignmentCeeBundle } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { ConvertMyLeadAssignmentButton } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { LeadGenerationAssignmentAircallSection } from "@/features/lead-generation/components/lead-generation-assignment-aircall-section";
import { LeadGenerationCommercialActivitySection } from "@/features/lead-generation/components/lead-generation-commercial-activity-section";
import { LeadGenerationCommercialPriorityBadge } from "@/features/lead-generation/components/lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "@/features/lead-generation/components/lead-generation-dispatch-queue-badge";
import { LeadGenerationStreetViewSection } from "@/features/lead-generation/components/lead-generation-street-view-section";
import { MyLeadQueueNextStepsCard } from "@/features/lead-generation/components/my-lead-queue-next-steps-card";
import { getLeadGenerationAssignmentActivities } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { getLeadGenerationMyQueueStockPageDetail } from "@/features/lead-generation/queries/get-lead-generation-stock-for-agent";
import { getAgentDashboardData } from "@/features/cee-workflows/queries/get-agent-dashboard-data";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import {
  canAccessCeeWorkflowsModule,
  canAccessLeadGenerationMyQueue,
  canBypassLeadGenMyQueueAsImpersonationActor,
} from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default async function MyLeadGenerationStockPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    notFound();
  }

  const { id } = await params;
  const detail = await getLeadGenerationMyQueueStockPageDetail(
    id,
    access.userId,
    canBypassLeadGenMyQueueAsImpersonationActor(access),
  );
  if (!detail) {
    notFound();
  }

  const { stock, assignmentCallTrace, openedViaSupportBypass, currentAssignmentAgentId, lastTerminalAssignmentId } =
    detail;
  const assignmentId = stock.current_assignment_id;
  const assignmentIdForHistory = assignmentId ?? lastTerminalAssignmentId ?? null;
  const assignmentBelongsToImpersonatedUser =
    !assignmentId || !currentAssignmentAgentId || currentAssignmentAgentId === access.userId;
  const lockActionsForSupportView = Boolean(openedViaSupportBypass && !assignmentBelongsToImpersonatedUser);
  const callTraceReadOnly =
    Boolean(stock.converted_lead_id) || lockActionsForSupportView || !stock.current_assignment_id;

  const activities = assignmentIdForHistory
    ? await getLeadGenerationAssignmentActivities(assignmentIdForHistory)
    : [];

  let ceeBundle: ConvertMyLeadAssignmentCeeBundle | null = null;
  if (canAccessCeeWorkflowsModule(access)) {
    const [dashboard, destratProducts] = await Promise.all([
      getAgentDashboardData(access, undefined, {
        restrictToLeadsCreatedByCurrentUser: !hasFullCeeWorkflowAccess(access),
      }),
      getAgentDestratSimulatorProducts(),
    ]);
    ceeBundle = {
      sheets: dashboard.sheets,
      activity: dashboard.activity,
      destratProducts,
    };
  }

  const primaryEmail = stock.email?.trim() || stock.enriched_email?.trim() || null;
  const emailHint =
    stock.email?.trim() && stock.enriched_email?.trim() && stock.email.trim() !== stock.enriched_email.trim()
      ? "Suggestion : " + stock.enriched_email
      : null;
  const decisionMakerLine =
    [stock.decision_maker_name?.trim(), stock.decision_maker_role?.trim()].filter(Boolean).join(" · ") || null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {openedViaSupportBypass ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-50">
          <p className="font-medium">Vue support (impersonation)</p>
          <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">
            Vous consultez cette fiche avec le compte du commercial. Si l’attribution courante n’est pas la sienne,
            les actions sensibles (conversion, journal, suivi d’appel) sont en lecture seule.
          </p>
        </div>
      ) : null}

      <PageHeader
        title={stock.company_name}
        description={[stock.city, stock.phone].filter(Boolean).join(" · ") || "Fiche prospection"}
        actions={
          <Link href="/lead-generation/my-queue" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            ← Ma file
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailRow label="Téléphone" value={stock.phone ?? stock.normalized_phone ?? "—"} />
          <DetailRow label="E-mail" value={primaryEmail ?? "—"} />
          {emailHint ? <p className="text-xs text-muted-foreground sm:col-span-2">{emailHint}</p> : null}
          <DetailRow label="Décideur / responsable" value={decisionMakerLine ?? "—"} />
          <DetailRow label="Ville" value={stock.city ?? "—"} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Score</span>
            <span className="text-lg font-semibold tabular-nums">{stock.commercial_score ?? 0}</span>
            <LeadGenerationCommercialPriorityBadge priority={stock.commercial_priority ?? "normal"} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">File de travail</p>
            <div className="mt-1">
              <LeadGenerationDispatchQueueBadge
                status={stock.dispatch_queue_status ?? "review"}
                reason={stock.dispatch_queue_reason}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {assignmentIdForHistory ? (
        <LeadGenerationAssignmentAircallSection
          assignmentId={assignmentIdForHistory}
          phone={stock.phone ?? stock.normalized_phone ?? null}
          readOnly={callTraceReadOnly}
          initial={assignmentCallTrace}
        />
      ) : null}

      <LeadGenerationStreetViewSection stock={stock} />

      <MyLeadQueueNextStepsCard stock={stock} activities={activities} />

      <LeadGenerationCommercialActivitySection
        assignmentId={assignmentIdForHistory}
        initialActivities={activities}
        variant="agent"
        readOnly={lockActionsForSupportView || callTraceReadOnly}
      />

      {stock.converted_lead_id ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Déjà convertie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Cette prospection a déjà été transformée en fiche prospect.</p>
            <Link
              href={`/leads/${stock.converted_lead_id}`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-fit")}
            >
              Ouvrir la fiche prospect
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!stock.converted_lead_id && assignmentId && !lockActionsForSupportView ? (
        <ConvertMyLeadAssignmentButton stock={stock} ceeBundle={ceeBundle} />
      ) : null}

      {!stock.converted_lead_id && !assignmentId ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Aucune attribution active sur cette fiche.
        </p>
      ) : null}

      <details className="rounded-lg border border-border bg-muted/20 text-sm">
        <summary className="cursor-pointer px-4 py-3 font-medium text-muted-foreground">Références techniques</summary>
        <div className="space-y-2 border-t border-border px-4 py-3 font-mono text-[11px] text-muted-foreground">
          <p>fiche : {stock.id}</p>
          {assignmentIdForHistory ? <p>suivi : {assignmentIdForHistory}</p> : null}
          <p>importée le {stock.imported_at ? formatDateTimeFr(stock.imported_at) : "—"}</p>
        </div>
      </details>
    </div>
  );
}
