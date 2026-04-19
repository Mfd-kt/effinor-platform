import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConvertMyLeadAssignmentCeeBundle } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { ConvertMyLeadAssignmentButton } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { LeadGenerationUnifiedAgentActivitySection } from "@/features/lead-generation/components/lead-generation-unified-agent-activity-section";
import { LeadGenerationCommercialPriorityBadge } from "@/features/lead-generation/components/lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "@/features/lead-generation/components/lead-generation-dispatch-queue-badge";
import { LeadGenerationCallReadinessCard } from "@/features/lead-generation/components/lead-generation-call-readiness-card";
import { LeadGenerationDropcontactPanel } from "@/features/lead-generation/components/lead-generation-dropcontact-panel";
import { LeadGenerationQuickValidationPanel } from "@/features/lead-generation/components/lead-generation-quick-validation-panel";
import { LeadGenerationStreetViewSection } from "@/features/lead-generation/components/lead-generation-street-view-section";
import { MyLeadQueueDecisionMakerFields } from "@/features/lead-generation/components/my-lead-queue-decision-maker-fields";
import { MyLeadQueueTopActionBar } from "@/features/lead-generation/components/my-lead-queue-top-action-bar";
import { getLeadGenerationAssignmentActivities } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { getLeadGenerationMyQueueStockPageDetail } from "@/features/lead-generation/queries/get-lead-generation-stock-for-agent";
import { getAgentDashboardData } from "@/features/cee-workflows/queries/get-agent-dashboard-data";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { isEligibleForDropcontactEnrichment } from "@/features/lead-generation/dropcontact/build-dropcontact-request";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import {
  canAccessCeeWorkflowsModule,
  canAccessLeadGenerationHub,
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

  const queueOwnerId =
    openedViaSupportBypass && currentAssignmentAgentId ? currentAssignmentAgentId : access.userId;
  const queueItems = await getMyLeadGenerationQueue(queueOwnerId);
  const queueIndex = queueItems.findIndex((item) => item.stockId === id);
  const nextStockId =
    queueIndex >= 0 && queueIndex < queueItems.length - 1 ? queueItems[queueIndex + 1]!.stockId : null;
  const assignmentId = stock.current_assignment_id;
  const assignmentIdForHistory = assignmentId ?? lastTerminalAssignmentId ?? null;
  const assignmentBelongsToImpersonatedUser =
    !assignmentId || !currentAssignmentAgentId || currentAssignmentAgentId === access.userId;
  const lockActionsForSupportView = Boolean(openedViaSupportBypass && !assignmentBelongsToImpersonatedUser);
  const callTraceReadOnly =
    Boolean(stock.converted_lead_id) || lockActionsForSupportView || !stock.current_assignment_id;

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
  const emailHint =
    stock.email?.trim() && stock.enriched_email?.trim() && stock.email.trim() !== stock.enriched_email.trim()
      ? "Suggestion : " + stock.enriched_email
      : null;
  const streetViewModel = buildLeadGenerationStreetViewModel(stock);
  const dropcontactElig = isEligibleForDropcontactEnrichment(stock);
  const leadGenHub = await canAccessLeadGenerationHub(access);
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
            <Link href="/lead-generation/my-queue" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Ma file
            </Link>
            {nextStockId ? (
              <Link
                href={`/lead-generation/my-queue/${nextStockId}`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
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
        disabled={
          Boolean(stock.converted_lead_id) ||
          stock.stock_status === "rejected" ||
          lockActionsForSupportView ||
          callTraceReadOnly
        }
        disableOutOfTarget={lockActionsForSupportView || callTraceReadOnly || !assignmentId}
      />

      <LeadGenerationDropcontactPanel
        stockId={stock.id}
        canResetDropcontact={leadGenHub}
        eligible={dropcontactElig.ok}
        disabled={
          Boolean(stock.converted_lead_id) ||
          stock.stock_status === "rejected" ||
          lockActionsForSupportView ||
          callTraceReadOnly
        }
        dropcontactStatus={stock.dropcontact_status ?? "idle"}
        dropcontactRequestedAt={stock.dropcontact_requested_at ?? null}
        dropcontactCompletedAt={stock.dropcontact_completed_at ?? null}
        dropcontactLastError={stock.dropcontact_last_error ?? null}
        email={stock.email?.trim() || stock.enriched_email?.trim() || null}
        phone={stock.phone?.trim() || stock.normalized_phone?.trim() || null}
        decisionMakerName={stock.decision_maker_name ?? null}
        decisionMakerRole={stock.decision_maker_role ?? null}
        linkedinUrl={stock.linkedin_url ?? null}
      />

      <LeadGenerationCallReadinessCard stock={stock} />

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
          {emailHint ? <p className="text-xs text-muted-foreground sm:col-span-2">{emailHint}</p> : null}
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Décideur</p>
            <MyLeadQueueDecisionMakerFields
              key={stock.updated_at}
              stockId={stock.id}
              initialName={stock.decision_maker_name}
              initialRole={stock.decision_maker_role}
              readOnly={lockActionsForSupportView || Boolean(stock.converted_lead_id)}
            />
          </div>
        </CardContent>
      </Card>

      {assignmentIdForHistory ? (
        <LeadGenerationUnifiedAgentActivitySection
          assignmentId={assignmentIdForHistory}
          nextStockId={nextStockId}
          readOnly={lockActionsForSupportView || callTraceReadOnly}
          initial={assignmentCallTrace}
          initialActivities={activities}
        />
      ) : null}

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
