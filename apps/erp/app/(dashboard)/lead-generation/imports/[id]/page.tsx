import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportBatchSyncButton } from "@/features/lead-generation/components/import-batch-sync-button";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import { getLeadGenerationImportBatchById } from "@/features/lead-generation/queries/get-lead-generation-import-batch-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function LeadGenerationImportBatchDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    notFound();
  }

  const { id } = await params;
  const batch = await getLeadGenerationImportBatchById(id);
  if (!batch) {
    notFound();
  }

  const metaJson = JSON.stringify(batch.metadata_json ?? {}, null, 2);
  const title = batch.source_label?.trim() || formatLeadGenerationSourceLabel(batch.source);
  const runRef = batch.external_run_id ?? batch.job_reference ?? "—";
  const errorHuman = batch.error_summary
    ? humanizeLeadGenerationActionError(batch.error_summary)
    : "";
  const showApifyErrorDetail =
    batch.error_summary &&
    batch.error_summary.trim() !== errorHuman.trim() &&
    batch.error_summary.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
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
            <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Lead Generation
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
        <CardContent className="space-y-2 text-sm">
          <dl className="space-y-2">
            <DetailRow label="Libellé" value={batch.source_label ?? "—"} />
            <DetailRow label="Source" value={formatLeadGenerationSourceLabel(batch.source)} />
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
