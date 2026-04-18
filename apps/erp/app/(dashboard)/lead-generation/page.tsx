import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationClosingCockpitPanel } from "@/features/lead-generation/components/lead-generation-closing-cockpit-panel";
import { LeadGenerationMainActions } from "@/features/lead-generation/components/lead-generation-main-actions";
import { LeadGenerationSimpleCockpit } from "@/features/lead-generation/components/lead-generation-simple-cockpit";
import { LeadGenerationUnifiedJourneyPanel } from "@/features/lead-generation/components/lead-generation-unified-journey-panel";
import { LeadGenerationPremiumPanel } from "@/features/lead-generation/components/lead-generation-premium-panel";
import { LeadGenerationImproveLeadsPanel } from "@/features/lead-generation/components/lead-generation-optimization-panel";
import { LeadGenerationRecycleToolbar } from "@/features/lead-generation/components/lead-generation-recycle-toolbar";
import { getLeadGenerationStockMetrics } from "@/features/lead-generation/analytics/get-lead-generation-stock-metrics";
import { buildLeadGenerationStockQuickFiltreUrl } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import { getLeadGenerationAssignableAgentsWithStock } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents-with-stock";
import { getLeadGenerationImportBatches } from "@/features/lead-generation/queries/get-lead-generation-import-batches";
import type { LeadGenerationImportBatchListItem } from "@/features/lead-generation/queries/get-lead-generation-import-batches";
import {
  getLeadGenerationPipelineCockpitSnapshot,
  type LeadGenerationPipelineCockpitSnapshot,
} from "@/features/lead-generation/queries/get-lead-generation-pipeline-cockpit-snapshot";
import { getUnifiedPipelineLockState } from "@/features/lead-generation/queries/get-unified-pipeline-lock-state";
import { getLeadGenerationClosingCockpitMetrics } from "@/features/lead-generation/queries/get-lead-generation-closing-cockpit-metrics";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
/** Génération multi-source + Apify peut dépasser le timeout par défaut des server actions. */
export const maxDuration = 300;

export default async function LeadGenerationPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  let agents: Awaited<ReturnType<typeof getLeadGenerationAssignableAgentsWithStock>> = [];
  try {
    agents = await getLeadGenerationAssignableAgentsWithStock();
  } catch {
    agents = [];
  }

  let pipelineSnapshot: LeadGenerationPipelineCockpitSnapshot = {
    stockReadyCount: 0,
    leadsReadyToAssign: 0,
    leadsNeedingContactImprovement: 0,
    importsRunning: 0,
    leadsStillBeingQualified: 0,
    recommendedStep: "generate",
    recommendedActionLabel:
      "Aucun lead actif : importez ou générez des contacts pour démarrer.",
  };
  let syncingImportBatches: LeadGenerationImportBatchListItem[] = [];
  let stockMetricsTotals = {
    totalStock: 0,
    readyNow: 0,
    enrichFirst: 0,
    stockReady: 0,
  };
  try {
    const [stockMetrics, runningImports] = await Promise.all([
      getLeadGenerationStockMetrics(),
      getLeadGenerationImportBatches({ filters: { status: "running" }, limit: 200, offset: 0 }),
    ]);
    syncingImportBatches = runningImports;
    const byDispatch = (k: string) =>
      stockMetrics.byDispatchQueueStatus.find((x) => x.key === k)?.count ?? 0;
    const byStock = (k: string) => stockMetrics.byStockStatus.find((x) => x.key === k)?.count ?? 0;
    stockMetricsTotals = {
      totalStock: stockMetrics.totalStock,
      readyNow: byDispatch("ready_now"),
      enrichFirst: byDispatch("enrich_first"),
      stockReady: byStock("ready"),
    };
    pipelineSnapshot = await getLeadGenerationPipelineCockpitSnapshot({
      stockReadyCount: byStock("ready"),
      leadsStillBeingQualified: byDispatch("enrich_first"),
      importsRunning: runningImports.length,
    });
  } catch {
    /* valeurs par défaut */
  }

  let pipelineLock: Awaited<ReturnType<typeof getUnifiedPipelineLockState>> = {
    locked: false,
    blockingCount: 0,
    coordinatorBatchId: null,
  };
  try {
    pipelineLock = await getUnifiedPipelineLockState();
  } catch {
    pipelineLock = { locked: false, blockingCount: 0, coordinatorBatchId: null };
  }

  let closingMetrics: Awaited<ReturnType<typeof getLeadGenerationClosingCockpitMetrics>> = {
    closingHighCount: 0,
    withDecisionMakerCount: 0,
    withLinkedInCount: 0,
    premiumReadyCount: 0,
  };
  try {
    closingMetrics = await getLeadGenerationClosingCockpitMetrics();
  } catch {
    /* défaut */
  }

  const cockpitAgentRows = [...agents]
    .sort(
      (a, b) =>
        b.activeStock - a.activeStock || a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" }),
    )
    .map((a) => ({ id: a.id, displayName: a.displayName, activeStock: a.activeStock }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeader
        className="mb-0 border-b border-border pb-6"
        titleClassName="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        title="Lead Generation"
        description={
          <span className="text-sm leading-relaxed text-muted-foreground">
            Trois gestes pour alimenter le carnet, le préparer et le confier aux équipes — le détail technique reste
            accessible plus bas.
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Link
              href="/lead-generation/stock"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
            >
              Stock
            </Link>
            <Link
              href="/lead-generation/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-border/80 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              )}
            >
              Réglages
            </Link>
          </div>
        }
      />

      <LeadGenerationSimpleCockpit metrics={stockMetricsTotals} agents={cockpitAgentRows} />

      <section aria-label="Métriques du carnet" className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Carnet (global)</h2>
          <Link
            href={buildLeadGenerationStockQuickFiltreUrl("pret")}
            className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
          >
            Voir le stock prêt
          </Link>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] text-muted-foreground">Fiches totales</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{stockMetricsTotals.totalStock}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Prêtes maintenant</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{stockMetricsTotals.readyNow}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">À compléter avant appel</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{stockMetricsTotals.enrichFirst}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Qualifiées « prêtes »</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{stockMetricsTotals.stockReady}</dd>
          </div>
        </dl>
      </section>

      <details
        id="lg-advanced-tools"
        className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm scroll-mt-20"
      >
        <summary className="cursor-pointer font-medium text-foreground outline-none">
          Outils avancés (sources multiples, automatisation, maintenance)
        </summary>
        <div className="mt-4 space-y-8">
          <nav aria-label="Raccourcis lead-generation" className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/lead-generation/imports">
              Imports
            </Link>
            <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/lead-generation/automation">
              Automatisations
            </Link>
            <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/lead-generation/analytics">
              Analytics
            </Link>
            <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/lead-generation/learning">
              Learning
            </Link>
          </nav>

          <LeadGenerationUnifiedJourneyPanel
            pipelineLock={pipelineLock}
            assignableAgentsCount={agents.length}
          />

          <LeadGenerationMainActions
            pipelineSnapshot={pipelineSnapshot}
            assignableAgentsCount={agents.length}
            syncingImportBatches={syncingImportBatches}
          />

          <LeadGenerationImproveLeadsPanel />

          <LeadGenerationClosingCockpitPanel metrics={closingMetrics} />

          <LeadGenerationPremiumPanel />

          <section className="space-y-2.5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Maintenance</h2>
            <LeadGenerationRecycleToolbar />
          </section>
        </div>
      </details>
    </div>
  );
}
