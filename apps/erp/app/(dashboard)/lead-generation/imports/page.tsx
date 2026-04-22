import { Filter } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { ImportBatchesFilters } from "@/features/lead-generation/components/import-batches-filters";
import { ImportBatchesKpis } from "@/features/lead-generation/components/import-batches-kpis";
import { ImportBatchesTable } from "@/features/lead-generation/components/import-batches-table";
import { LeadGenerationRecentImports } from "@/features/lead-generation/components/lead-generation-recent-imports";
import { StartLeboncoinImportModal } from "@/features/lead-generation/components/start-leboncoin-import-modal";
import {
  buildImportBatchesListUrl,
  type ImportBatchesListSearchState,
} from "@/features/lead-generation/lib/build-import-batches-list-url";
import { getImportBatchesKpis, type ImportBatchesKpis as ImportBatchesKpisType } from "@/features/lead-generation/queries/get-import-batches-kpis";
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

const FALLBACK_KPIS: ImportBatchesKpisType = {
  active: 0,
  monthTotal: 0,
  monthCompleted: 0,
  monthFailed: 0,
};

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
  const status = spStr(sp, "status");
  const pageRaw = spStr(sp, "page");
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters: ImportBatchesListSearchState = {
    status,
    page,
  };

  const filterPayload = {
    ...(status ? { status } : {}),
  };
  const hasActiveFilters = Object.keys(filterPayload).length > 0;

  /** Rôle quantificateur seul : listes et prévisualisations limitées aux lots créés par l’utilisateur courant (aligné sur la page détail et les actions sync). */
  const createdByFilter = quantifierOnly ? { created_by_user_id: access.userId } : {};
  const kpiOwner = quantifierOnly ? access.userId : null;

  const [recentForPreview, kpis] = await Promise.all([
    getLeadGenerationImportBatches({
      limit: RECENT_IMPORTS,
      offset: 0,
      filters: quantifierOnly ? createdByFilter : undefined,
    }).catch(() => [] as Awaited<ReturnType<typeof getLeadGenerationImportBatches>>),
    getImportBatchesKpis({ createdByUserId: kpiOwner }).catch(() => FALLBACK_KPIS),
  ]);

  const listFilters =
    hasActiveFilters || quantifierOnly ? { ...filterPayload, ...createdByFilter } : undefined;

  let rows: Awaited<ReturnType<typeof getLeadGenerationImportBatches>>;
  try {
    rows = await getLeadGenerationImportBatches({
      filters: listFilters,
      limit: PAGE_SIZE,
      offset,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement des imports.";
    return (
      <div className="space-y-6">
        <PageHeader
          title="Imports"
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
    <div className="space-y-8">
      <PageHeader
        title="Imports"
        description={
          quantifierOnly
            ? "Vos lots lancés depuis la quantification (synchronisation Apify)."
            : "Importer des fiches, lancer un scraping immobilier, synchroniser les lots."
        }
        actions={<StartLeboncoinImportModal />}
      />

      <ImportBatchesKpis kpis={kpis} scopedToMe={quantifierOnly} />

      <section className="space-y-3">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {quantifierOnly ? "Vos derniers lots" : "Derniers imports"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {quantifierOnly
              ? `Les ${RECENT_IMPORTS} derniers que vous avez lancés.`
              : `Les ${RECENT_IMPORTS} plus récents — synchronisez quand le fournisseur a terminé.`}
          </p>
        </header>
        <LeadGenerationRecentImports rows={recentForPreview} />
      </section>

      <CollapsibleSection
        title="Filtres"
        icon={<Filter className="size-4" aria-hidden />}
        defaultOpen={hasActiveFilters}
        badge={
          hasActiveFilters ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {Object.keys(filterPayload).length} actif{Object.keys(filterPayload).length > 1 ? "s" : ""}
            </span>
          ) : null
        }
      >
        <ImportBatchesFilters defaults={filters} />
      </CollapsibleSection>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Liste des imports</h2>
          <p className="text-xs text-muted-foreground">
            Page {page} · {rows.length} ligne{rows.length > 1 ? "s" : ""}
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Aucun import ne correspond à ces filtres. Ajustez les critères ci-dessus."
              : "Aucun import pour le moment. Lancez un scraping Le Bon Coin avec le bouton ci-dessus."}
          </p>
        ) : (
          <ImportBatchesTable rows={rows} />
        )}
        {(hasPrev || hasNext) && (
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
        )}
      </section>

    </div>
  );
}
