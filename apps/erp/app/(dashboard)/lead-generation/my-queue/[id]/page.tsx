import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConvertMyLeadAssignmentCeeBundle } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { ConvertMyLeadAssignmentButton } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { MyQueueConvertedAutoRedirect } from "@/features/lead-generation/components/my-queue-converted-auto-redirect";
import type { LeadGenerationGptResearchPayload } from "@/features/lead-generation/domain/lead-generation-gpt-research";
import { LeadGenerationUnifiedAgentActivitySection } from "@/features/lead-generation/components/lead-generation-unified-agent-activity-section";
import { LeadGenerationCommercialPriorityBadge } from "@/features/lead-generation/components/lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "@/features/lead-generation/components/lead-generation-dispatch-queue-badge";
import {
  LeadGenerationGptCommercialInsightBlock,
  shouldShowLeadGenerationGptCommercialInsight,
} from "@/features/lead-generation/components/lead-generation-gpt-commercial-insight-block";
import { LeadGenerationCallReadinessCard } from "@/features/lead-generation/components/lead-generation-call-readiness-card";
import { LeadGenerationQuickValidationPanel } from "@/features/lead-generation/components/lead-generation-quick-validation-panel";
import { LeadGenerationStreetViewSection } from "@/features/lead-generation/components/lead-generation-street-view-section";
import { MyLeadQueueDecisionMakerFields } from "@/features/lead-generation/components/my-lead-queue-decision-maker-fields";
import { MyLeadQueueTopActionBar } from "@/features/lead-generation/components/my-lead-queue-top-action-bar";
import { getLeadGenerationAssignmentActivities } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { isLeadGenerationGptResearchSuccessful } from "@/features/lead-generation/lib/lead-generation-gpt-research-terminal-status";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { getLeadGenerationMyQueueStockPageDetail } from "@/features/lead-generation/queries/get-lead-generation-stock-for-agent";
import { getFirstMyQueueStockId, getNextMyQueueStockIdAfter } from "@/features/lead-generation/lib/my-queue-next-stock";
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | null {
  return typeof v === "string" ? v : null;
}

function isSafeReturnTo(href: string | null): boolean {
  return Boolean(href?.startsWith("/lead-generation/my-queue"));
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default async function MyLeadGenerationStockPage({ params, searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    notFound();
  }

  const { id } = await params;
  const sp = await searchParams;
  const fromParam = firstString(sp.from);
  const detail = await getLeadGenerationMyQueueStockPageDetail(
    id,
    access.userId,
    canBypassLeadGenMyQueueAsImpersonationActor(access),
  );
  if (!detail) {
    const fallback = isSafeReturnTo(fromParam) ? fromParam! : "/lead-generation/my-queue";
    const p = new URLSearchParams();
    p.set("stale", "1");
    redirect(`${fallback}${fallback.includes("?") ? "&" : "?"}${p.toString()}`);
  }

  const { stock, assignmentCallTrace, openedViaSupportBypass, currentAssignmentAgentId, lastTerminalAssignmentId } =
    detail;

  const queueOwnerId =
    openedViaSupportBypass && currentAssignmentAgentId ? currentAssignmentAgentId : access.userId;
  const queueItems = await getMyLeadGenerationQueue(queueOwnerId);
  const backHref = isSafeReturnTo(fromParam) ? fromParam! : "/lead-generation/my-queue";

  if (stock.converted_lead_id) {
    const nextAfterConverted = getFirstMyQueueStockId(queueItems);
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
          description="Fiche lead generation convertie"
          actions={
            <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Ma file
            </Link>
          }
        />
        <MyQueueConvertedAutoRedirect
          nextStockId={nextAfterConverted}
          fromHref={backHref}
          convertedLeadId={stock.converted_lead_id}
        />
      </div>
    );
  }

  const nextStockId = getNextMyQueueStockIdAfter(queueItems, id);
  const nextHref = nextStockId
    ? (() => {
        const p = new URLSearchParams();
        p.set("from", backHref);
        p.set("focus", nextStockId);
        return `/lead-generation/my-queue/${nextStockId}?${p.toString()}`;
      })()
    : null;
  const assignmentId = stock.current_assignment_id;
  const assignmentIdForHistory = assignmentId ?? lastTerminalAssignmentId ?? null;
  const assignmentBelongsToImpersonatedUser =
    !assignmentId || !currentAssignmentAgentId || currentAssignmentAgentId === access.userId;
  const lockActionsForSupportView = Boolean(openedViaSupportBypass && !assignmentBelongsToImpersonatedUser);
  const callTraceReadOnly = lockActionsForSupportView || !stock.current_assignment_id;

  const activities = assignmentIdForHistory
    ? await getLeadGenerationAssignmentActivities(assignmentIdForHistory, { limit: 120 })
    : [];
  const phoneLine = stock.phone ?? stock.normalized_phone ?? null;

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
  const streetViewModel = buildLeadGenerationStreetViewModel(stock);
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
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <LeadGenerationDispatchQueueBadge
              status={stock.dispatch_queue_status ?? "review"}
              reason={stock.dispatch_queue_reason}
              compact
              tooltipReasonOnly
              className="flex-row items-center gap-2"
            />
            <span className="text-muted-foreground">·</span>
            <span className="text-sm tabular-nums font-semibold">{stock.commercial_score ?? 0}</span>
            <LeadGenerationCommercialPriorityBadge priority={stock.commercial_priority ?? "normal"} />
            {stock.city ? (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{stock.city}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Ma file
            </Link>
            {nextHref ? (
              <Link href={nextHref} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Suivant →
              </Link>
            ) : null}
          </>
        }
      />

      <LeadGenerationQuickValidationPanel
        stockId={stock.id}
        mapsUrl={streetViewModel.openMapsUrl}
        showMapsLink={streetViewModel.canShowSection}
        variant="agent"
        disabled={
          stock.stock_status === "rejected" || lockActionsForSupportView || callTraceReadOnly
        }
        disableOutOfTarget={lockActionsForSupportView || callTraceReadOnly || !assignmentId}
      />

      <LeadGenerationCallReadinessCard stock={stock} />

      {isLeadGenerationGptResearchSuccessful(stock.research_gpt_status) &&
      stock.research_gpt_payload &&
      shouldShowLeadGenerationGptCommercialInsight(stock.research_gpt_payload) ? (
        <Card className="border-primary/15 bg-card/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aide appel (GPT)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Script et contact suggérés pour le premier appel — sans le détail technique quantificateur.
            </p>
          </CardHeader>
          <CardContent>
            <LeadGenerationGptCommercialInsightBlock
              payload={stock.research_gpt_payload as LeadGenerationGptResearchPayload}
              researchGptStatus={stock.research_gpt_status ?? "idle"}
              variant="agent"
            />
          </CardContent>
        </Card>
      ) : null}

      {assignmentIdForHistory ? (
        <MyLeadQueueTopActionBar
          assignmentId={assignmentIdForHistory}
          stock={stock}
          activities={activities}
          phone={phoneLine}
          readOnly={lockActionsForSupportView || callTraceReadOnly}
        />
      ) : null}

      <LeadGenerationStreetViewSection stock={stock} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailRow label="E-mail" value={primaryEmail ?? "—"} />
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Décideur</p>
            <MyLeadQueueDecisionMakerFields
              key={stock.updated_at}
              stockId={stock.id}
              initialName={stock.decision_maker_name}
              initialRole={stock.decision_maker_role}
              readOnly={lockActionsForSupportView}
            />
          </div>
        </CardContent>
      </Card>

      {assignmentIdForHistory ? (
        <LeadGenerationUnifiedAgentActivitySection
          assignmentId={assignmentIdForHistory}
          stockId={stock.id}
          nextStockId={nextStockId}
          returnToHref={backHref}
          readOnly={lockActionsForSupportView || callTraceReadOnly}
          initial={assignmentCallTrace}
          initialActivities={activities}
        />
      ) : null}

      {assignmentId && !lockActionsForSupportView ? (
        <ConvertMyLeadAssignmentButton
          stock={stock}
          ceeBundle={ceeBundle}
          myQueuePostConversion={{
            nextStockId,
            listHrefForFromParam: backHref,
          }}
        />
      ) : null}

      {!assignmentId ? (
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
