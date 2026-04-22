import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportBatchCeeTeamEditor } from "@/features/lead-generation/components/import-batch-cee-team-editor";
import { ImportBatchRetrySyncButton } from "@/features/lead-generation/components/import-batch-retry-sync-button";
import { ImportBatchSyncButton } from "@/features/lead-generation/components/import-batch-sync-button";
import { LeadGenerationStockListView } from "@/features/lead-generation/components/lead-generation-stock-list-view";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { formatMyQueueCeeSheetOptionLabel } from "@/features/lead-generation/lib/my-queue-cee-sheet-option";
import { buildLeadGenerationStockPageUrl, type LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import { assessLeadGenerationImportSyncRetryEligibility } from "@/features/lead-generation/lib/lead-generation-import-sync-retry-eligibility";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import { getLeadGenerationCeeImportScope } from "@/features/lead-generation/queries/get-lead-generation-cee-import-scope";
import { getLeadGenerationImportBatchById } from "@/features/lead-generation/queries/get-lead-generation-import-batch-by-id";
import { getLeadGenerationStock } from "@/features/lead-generation/queries/get-lead-generation-stock";
import { getLeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantification,
} from "@/lib/auth/module-access";
import { canAccessLeadGenerationImportBatchAsUser } from "@/features/lead-generation/lib/lead-generation-import-batch-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const IMPORT_DETAIL_PAGE_SIZE = 50;

function spPage(sp: Record<string, string | string[] | undefined>): number {
  const v = sp.page;
  const raw = typeof v === "string" ? v : undefined;
  const n = Math.max(1, parseInt(raw ?? "1", 10) || 1);
  return n;
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function shortRef(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running") return "secondary";
  return "outline";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  );
}

function importDetailPath(id: string, page: number): string {
  if (page <= 1) return `/lead-generation/imports/${id}`;
  return `/lead-generation/imports/${id}?page=${page}`;
}

export default async function LeadGenerationImportBatchDetailPage({ params, searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    notFound();
  }
  const hub = await canAccessLeadGenerationHub(access);
  const quantifier = canAccessLeadGenerationQuantification(access);

  const { id } = await params;
  const sp = await searchParams;
  const page = spPage(sp);
  const offset = (page - 1) * IMPORT_DETAIL_PAGE_SIZE;
  const batch = await getLeadGenerationImportBatchById(id);
  if (!batch) {
    notFound();
  }

  const quantifierOwnsBatch = quantifier && batch.created_by_user_id === access.userId;
  if (!(await canAccessLeadGenerationImportBatchAsUser(access, batch))) {
    notFound();
  }
  const quantifierRestricted = !hub && quantifierOwnsBatch;

  let ceeImportScope: Awaited<ReturnType<typeof getLeadGenerationCeeImportScope>> | null = null;
  try {
    ceeImportScope = await getLeadGenerationCeeImportScope();
  } catch {
    ceeImportScope = null;
  }

  const metaJson = JSON.stringify(batch.metadata_json ?? {}, null, 2);
  const title = batch.source_label?.trim() || formatLeadGenerationSourceLabel(batch.source);
  const campaignName =
    typeof batch.metadata_json === "object" &&
    batch.metadata_json !== null &&
    !Array.isArray(batch.metadata_json) &&
    typeof (batch.metadata_json as Record<string, unknown>).campaignName === "string"
      ? ((batch.metadata_json as Record<string, unknown>).campaignName as string).trim()
      : "";
  const runRef = batch.external_run_id ?? batch.job_reference ?? "—";
  const syncRetryEligibility = assessLeadGenerationImportSyncRetryEligibility(batch);
  const errorHuman = batch.error_summary
    ? humanizeLeadGenerationActionError(batch.error_summary)
    : "";
  const showApifyErrorDetail =
    batch.error_summary &&
    batch.error_summary.trim() !== errorHuman.trim() &&
    batch.error_summary.length > 0;

  const stockFilters = { import_batch_id: id };
  const linkBase: LeadGenerationListSearchState = { import_batch: id };
  let stockRows: Awaited<ReturnType<typeof getLeadGenerationStock>> = [];
  let stockSummary: Awaited<ReturnType<typeof getLeadGenerationStockSummary>> | null = null;
  let stockLoadError: string | null = null;

  try {
    [stockRows, stockSummary] = await Promise.all([
      getLeadGenerationStock({
        filters: stockFilters,
        limit: IMPORT_DETAIL_PAGE_SIZE,
        offset,
      }),
      getLeadGenerationStockSummary(stockFilters),
    ]);
  } catch (e) {
    stockLoadError = e instanceof Error ? e.message : "Impossible de charger les fiches de cet import.";
  }

  const hasPrev = page > 1 && !stockLoadError && stockSummary;
  const hasNext =
    !stockLoadError && stockSummary ? offset + stockRows.length < stockSummary.totalMatching : false;
  const prevHref = hasPrev ? importDetailPath(id, page - 1) : null;
  const nextHref = hasNext ? importDetailPath(id, page + 1) : null;
  const totalPages = Math.max(
    1,
    stockSummary ? Math.ceil(stockSummary.totalMatching / IMPORT_DETAIL_PAGE_SIZE) : 1,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title={title}
        description={`Import · ${formatDateTimeFr(batch.created_at)} · réf. ${shortRef(batch.id)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/lead-generation/imports"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ← Liste des imports
            </Link>
            <Link
              href={quantifierRestricted ? "/lead-generation/quantification" : "/lead-generation"}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {quantifierRestricted ? "Quantification" : "Lead Generation"}
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={statusBadgeVariant(batch.status)} className="text-xs capitalize">
          {batch.status}
        </Badge>
        {batch.external_status ? (
          <Badge variant="outline" className="text-xs">
            Apify : {batch.external_status}
          </Badge>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vue d’ensemble</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="space-y-2">
            <DetailRow label="Libellé" value={batch.source_label ?? "—"} />
            <DetailRow label="Source" value={formatLeadGenerationSourceLabel(batch.source)} />
            <DetailRow
              label="Campagne (métadonnées)"
              value={campaignName.length > 0 ? campaignName : "—"}
            />
          </dl>
          {ceeImportScope && !quantifierRestricted ? (
            <ImportBatchCeeTeamEditor
              batchId={batch.id}
              initialCeeSheetId={batch.cee_sheet_id}
              initialTargetTeamId={batch.target_team_id}
              scope={ceeImportScope}
              displayFallbacks={{
                ceeSheetCode: batch.cee_sheet_resolved_code ?? batch.cee_sheet_code,
                ceeSheetLabel: batch.cee_sheet_resolved_label,
                targetTeamName: batch.target_team_resolved_name,
              }}
            />
          ) : (
            <div className="space-y-2">
              <dl className="space-y-2">
                <DetailRow
                  label="Fiche CEE"
                  value={
                    batch.cee_sheet_id
                      ? formatMyQueueCeeSheetOptionLabel({
                          id: batch.cee_sheet_id,
                          code: batch.cee_sheet_resolved_code ?? batch.cee_sheet_code ?? "",
                          label: batch.cee_sheet_resolved_label ?? batch.cee_sheet_code ?? "",
                        })
                      : "—"
                  }
                />
                <DetailRow
                  label="Équipe cible"
                  value={
                    batch.target_team_resolved_name?.trim()
                      ? batch.target_team_resolved_name.trim()
                      : batch.target_team_id
                        ? shortRef(batch.target_team_id)
                        : "—"
                  }
                />
              </dl>
              {!ceeImportScope && !quantifierRestricted ? (
                <p className="text-xs text-destructive">
                  Impossible de charger le référentiel CEE : l’édition du rattachement est indisponible.
                </p>
              ) : null}
            </div>
          )}
          <dl className="space-y-2">
            <DetailRow label="Référence run Apify" value={runRef} />
            <DetailRow label="Jeu de données (dataset)" value={batch.external_dataset_id ?? "—"} />
            <DetailRow
              label="Début ingestion"
              value={batch.ingest_started_at ? formatDateTimeFr(batch.ingest_started_at) : "—"}
            />
            <DetailRow label="Démarré le" value={batch.started_at ? formatDateTimeFr(batch.started_at) : "—"} />
            <DetailRow label="Terminé le" value={batch.finished_at ? formatDateTimeFr(batch.finished_at) : "—"} />
            <DetailRow label="Créé le" value={formatDateTimeFr(batch.created_at)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiches importées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <DetailRow label="Importées" value={String(batch.imported_count)} />
          <DetailRow label="Acceptées" value={String(batch.accepted_count)} />
          <DetailRow label="Doublons" value={String(batch.duplicate_count)} />
          <DetailRow label="Rejetées" value={String(batch.rejected_count)} />
        </CardContent>
      </Card>

      {!stockLoadError &&
      stockSummary &&
      stockSummary.totalMatching === 0 &&
      batch.imported_count > 0 ? (
        <Card className="border-border bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Aucune fiche stock pour cet ID d&apos;import</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Les compteurs indiquent des lignes côté import, mais aucune fiche n&apos;a{" "}
              <code className="rounded bg-muted px-1 text-xs">import_batch_id</code> égal à cette page. Relancez la
              section <strong className="text-foreground">Synchronisation</strong> ci-dessous ou vérifiez qu&apos;aucune
              erreur d&apos;ingestion n&apos;a été enregistrée.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {stockLoadError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {stockLoadError}
        </p>
      ) : stockSummary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock lié à cet import</CardTitle>
            <p className="text-xs text-muted-foreground">
              {quantifierRestricted ? (
                <>
                  Aperçu paginé des fiches du lot (lecture seule). Validation et qualification depuis la page{" "}
                  <Link
                    href="/lead-generation/quantification"
                    className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 align-baseline")}
                  >
                    Quantification
                  </Link>
                  .
                </>
              ) : (
                <>
                  Liste paginée ({IMPORT_DETAIL_PAGE_SIZE} fiches par page). Vue Stock globale :{" "}
                  <Link
                    href={buildLeadGenerationStockPageUrl(linkBase)}
                    className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 align-baseline")}
                  >
                    même lot, filtres complets
                  </Link>
                  .
                </>
              )}
            </p>
          </CardHeader>
          <CardContent>
            <LeadGenerationStockListView
              rows={stockRows}
              summary={stockSummary}
              page={page}
              pageSize={IMPORT_DETAIL_PAGE_SIZE}
              linkBase={linkBase}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {prevHref ? (
                <Link href={prevHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  ← Page précédente
                </Link>
              ) : null}
              {stockSummary && stockSummary.totalMatching > 0 ? (
                <span className="text-sm tabular-nums text-muted-foreground">
                  Page {page} / {totalPages} ({stockSummary.totalMatching} fiche{stockSummary.totalMatching > 1 ? "s" : ""})
                </span>
              ) : null}
              {nextHref ? (
                <Link href={nextHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Page suivante →
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {batch.error_summary ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-destructive">{errorHuman}</p>
            {showApifyErrorDetail ? (
              <details className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs">
                <summary className="cursor-pointer font-medium text-foreground">Réponse brute Apify</summary>
                <p className="mt-2 whitespace-pre-wrap font-mono text-muted-foreground">{batch.error_summary}</p>
              </details>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Synchronisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Relance la récupération des résultats Apify vers le stock lorsque le scraping est terminé.
          </p>
          <ImportBatchSyncButton batchId={batch.id} />
          {batch.status === "failed" ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Lot en erreur : vous pouvez retenter une récupération depuis Apify si la référence du run est encore
                enregistrée sur ce lot.
              </p>
              <ImportBatchRetrySyncButton batchId={batch.id} eligibility={syncRetryEligibility} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="group rounded-lg border border-border bg-card">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Données techniques
            <span className="text-xs font-normal text-muted-foreground group-open:hidden">Afficher</span>
            <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Masquer</span>
          </span>
        </summary>
        <div className="space-y-4 border-t border-border px-4 py-4 text-sm">
          <dl className="space-y-2">
            <DetailRow label="ID import" value={batch.id} />
            <DetailRow label="Référence job" value={batch.job_reference ?? "—"} />
            <DetailRow label="ID run externe" value={batch.external_run_id ?? "—"} />
            <DetailRow label="ID dataset externe" value={batch.external_dataset_id ?? "—"} />
          </dl>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Métadonnées (JSON)</p>
            <pre className="max-h-[min(60vh,480px)] overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
              {metaJson}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
