import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { ImportBatchesFilters } from "@/features/lead-generation/components/import-batches-filters";
import { ImportBatchesTable } from "@/features/lead-generation/components/import-batches-table";
import { LeadGenerationRecentImports } from "@/features/lead-generation/components/lead-generation-recent-imports";
import { ManualCsvImportPanel } from "@/features/lead-generation/components/manual-csv-import-panel";
import { StartLeboncoinImportModal } from "@/features/lead-generation/components/start-leboncoin-import-modal";
import { buildImportBatchesListUrl, type ImportBatchesListSearchState } from "@/features/lead-generation/lib/build-import-batches-list-url";
import { getLeadGenerationCeeImportScope } from "@/features/lead-generation/queries/get-lead-generation-cee-import-scope";
import { getLeadGenerationImportBatches } from "@/features/lead-generation/queries/get-lead-generation-import-batches";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantifierImports,
} from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Imports et synchronisations (actions serveur pouvant être longues). */
export const maxDuration = 300;

const PAGE_SIZE = 50;
const RECENT_IMPORTS = 5;

function spStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadGenerationImportsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    notFound();
  }
  const hub = await canAccessLeadGenerationHub(access);
  const quantifierImports = canAccessLeadGenerationQuantifierImports(access);
  if (!hub && !quantifierImports) {
    notFound();
  }
  const quantifierOnly = !hub && quantifierImports;

  const sp = await searchParams;
  const source = spStr(sp, "source");
  const status = spStr(sp, "status");
  const external_status = spStr(sp, "external_status");
  const pageRaw = spStr(sp, "page");
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters: ImportBatchesListSearchState = {
    source,
    status,
    external_status,
    page,
  };

  const filterPayload = {
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
    ...(external_status ? { external_status } : {}),
  };

  /** Rôle quantificateur seul : listes et prévisualisations limitées aux lots créés par l’utilisateur courant (aligné sur la page détail et les actions sync). */
  const createdByFilter = quantifierOnly ? { created_by_user_id: access.userId } : {};

  let recentForPreview: Awaited<ReturnType<typeof getLeadGenerationImportBatches>> = [];
  try {
    recentForPreview = await getLeadGenerationImportBatches({
      limit: RECENT_IMPORTS,
      offset: 0,
      filters: quantifierOnly ? createdByFilter : undefined,
    });
  } catch {
    recentForPreview = [];
  }

  let ceeImportScope: Awaited<ReturnType<typeof getLeadGenerationCeeImportScope>> = { sheets: [], teams: [] };
  try {
    ceeImportScope = quantifierOnly ? { sheets: [], teams: [] } : await getLeadGenerationCeeImportScope();
  } catch {
    ceeImportScope = { sheets: [], teams: [] };
  }

  const listFilters =
    Object.keys(filterPayload).length > 0 || quantifierOnly
      ? { ...filterPayload, ...createdByFilter }
      : undefined;

  let rows;
  try {
    rows = await getLeadGenerationImportBatches({
      filters: listFilters,
      limit: PAGE_SIZE,
      offset,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement des imports.";
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <PageHeader
          title="Imports Lead Generation"
          description="Historique des imports depuis le scraping et synchronisation avec Apify."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === PAGE_SIZE;

  const prevHref = hasPrev ? buildImportBatchesListUrl({ ...filters, page: page - 1 }) : null;
  const nextHref = hasNext ? buildImportBatchesListUrl({ ...filters, page: page + 1 }) : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title="Imports Lead Generation"
        description={
          quantifierOnly
            ? "Vos lots lancés depuis la quantification (synchronisation Apify)."
            : "Importer des fiches, lancer un scraping cartes, synchroniser les lots."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StartLeboncoinImportModal />
            <Link
              href={quantifierOnly ? "/lead-generation/quantification" : "/lead-generation"}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {quantifierOnly ? "Quantification" : "Vue d’ensemble"}
            </Link>
          </div>
        }
      />

      <nav
        aria-label="Navigation acquisition"
        className="flex flex-wrap gap-2 border-b border-border/70 pb-4 text-sm"
      >
        {quantifierOnly ? (
          <Link
            href="/lead-generation/quantification"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            Quantification
          </Link>
        ) : (
          <>
            <Link
              href="/lead-generation"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
            >
              Stock
            </Link>
            <Link
              href="/lead-generation/my-queue"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
            >
              Ma file à traiter
            </Link>
          </>
        )}
      </nav>

      {!quantifierOnly ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Importer un fichier CSV</h2>
          <ManualCsvImportPanel ceeScope={ceeImportScope} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {quantifierOnly ? "Vos derniers lots" : "Derniers imports"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {quantifierOnly
            ? `Les ${RECENT_IMPORTS} derniers lots que vous avez lancés. Synchronisez lorsque le scraping est terminé.`
            : `Les ${RECENT_IMPORTS} derniers lots. Synchronisez lorsque le fournisseur a terminé.`}
        </p>
        <LeadGenerationRecentImports rows={recentForPreview} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
        <ImportBatchesFilters defaults={filters} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Liste des imports</h2>
          <p className="text-xs text-muted-foreground">
            Page {page} · {rows.length} ligne(s)
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            Aucun import pour ces filtres.
          </p>
        ) : (
          <ImportBatchesTable rows={rows} />
        )}
        <div className="flex flex-wrap gap-2">
          {hasPrev && prevHref ? (
            <Link href={prevHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Précédent
            </Link>
          ) : null}
          {hasNext && nextHref ? (
            <Link href={nextHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Suivant
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
