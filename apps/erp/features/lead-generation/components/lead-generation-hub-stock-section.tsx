import { Filter, Wrench } from "lucide-react";
import { Suspense } from "react";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiCardSkeletonGrid } from "@/components/shared/kpi-card-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { LeadGenerationDuplicateScanPanel } from "@/features/lead-generation/components/lead-generation-duplicate-scan-panel";
import { LeadGenerationFilters } from "@/features/lead-generation/components/lead-generation-filters";
import { LeadGenerationStockListBlockAsync } from "@/features/lead-generation/components/lead-generation-stock-list-block-async";
import { LeadGenerationStockKpisSectionAsync } from "@/features/lead-generation/components/lead-generation-stock-kpis-section-async";
import { type LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import { type GetLeadGenerationStockFilters } from "@/features/lead-generation/queries/get-lead-generation-stock";

const STOCK_FORM_ACTION = "/lead-generation";

function spStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export function LeadGenerationHubStockSection({ searchParams: sp }: Props) {
  const company_search = spStr(sp, "company_search");
  const stock_status = spStr(sp, "stock_status");
  const qualification_status = spStr(sp, "qualification_status");
  const source = spStr(sp, "source");
  const city = spStr(sp, "city");
  const dispatch_queue_status = spStr(sp, "dispatch_queue_status");
  const pageRaw = spStr(sp, "page");
  const filtreRaw = spStr(sp, "filtre");
  const importBatchRaw = spStr(sp, "import_batch");
  const import_batch =
    importBatchRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(importBatchRaw)
      ? importBatchRaw
      : undefined;
  const closing_readiness_status = spStr(sp, "closing_readiness_status");
  const filtre =
    filtreRaw === "pret" ||
    filtreRaw === "enrichir" ||
    filtreRaw === "rejet" ||
    filtreRaw === "premium" ||
    filtreRaw === "contact_gap"
      ? filtreRaw
      : undefined;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const filters: LeadGenerationListSearchState = {
    company_search,
    stock_status,
    qualification_status,
    source,
    city,
    page,
    filtre,
    import_batch,
    dispatch_queue_status,
    closing_readiness_status,
  };

  const filterPayload: GetLeadGenerationStockFilters = {
    ...(company_search ? { company_search } : {}),
    ...(stock_status ? { stock_status } : {}),
    ...(qualification_status ? { qualification_status } : {}),
    ...(source ? { source } : {}),
    ...(city ? { city } : {}),
    ...(import_batch ? { import_batch_id: import_batch } : {}),
    ...(closing_readiness_status ? { closing_readiness_status } : {}),
  };
  if (filtre === "pret") {
    filterPayload.dispatch_queue_status = "ready_now";
  } else if (filtre === "enrichir") {
    filterPayload.dispatch_queue_status = "enrich_first";
  } else if (filtre === "rejet") {
    filterPayload.stock_status = "rejected";
  } else if (filtre === "premium") {
    filterPayload.lead_tier = "premium";
  } else if (filtre === "contact_gap") {
    filterPayload.needs_contact_improvement = true;
  }
  if (filtre !== "pret" && filtre !== "enrichir" && dispatch_queue_status) {
    filterPayload.dispatch_queue_status = dispatch_queue_status;
  }

  const filtersForQuery = Object.keys(filterPayload).length > 0 ? filterPayload : undefined;

  const linkBase: LeadGenerationListSearchState = {
    company_search: filters.company_search,
    stock_status: filters.stock_status,
    qualification_status: filters.qualification_status,
    source: filters.source,
    city: filters.city,
    import_batch: filters.import_batch,
    dispatch_queue_status: filters.dispatch_queue_status,
    closing_readiness_status: filters.closing_readiness_status,
  };

  const activeStockChip = filtre === "rejet" ? "rejected" : filterPayload.stock_status;
  const activeDispatchChip =
    filtre === "pret" ? "ready_now" : filtre === "enrichir" ? "enrich_first" : filterPayload.dispatch_queue_status;

  const activeFilterCount = Object.keys(filterPayload).length;
  const hasActiveFilters = activeFilterCount > 0;

  const filterNotice =
    filtre === "pret"
      ? "Filtre actif : prêts à contacter."
      : filtre === "enrichir"
        ? "Filtre actif : à enrichir avant diffusion."
        : filtre === "rejet"
          ? "Filtre actif : rejetés."
          : filtre === "premium"
            ? "Filtre actif : leads premium."
            : filtre === "contact_gap"
              ? `Filtre actif : contact incomplet${import_batch ? ` · lot ${import_batch.slice(0, 8)}…` : ""}.`
              : closing_readiness_status === "high"
                ? "Filtre actif : closing fort uniquement."
                : null;

  return (
    <div className="space-y-6">
      <Suspense fallback={<KpiCardSkeletonGrid count={4} />}>
        <LeadGenerationStockKpisSectionAsync
          filtersForQuery={filtersForQuery}
          hasActiveFilters={hasActiveFilters}
        />
      </Suspense>

      <CollapsibleSection
        title="Filtres"
        icon={<Filter className="size-4" aria-hidden />}
        defaultOpen={hasActiveFilters}
        badge={
          hasActiveFilters ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {activeFilterCount} actif{activeFilterCount > 1 ? "s" : ""}
            </span>
          ) : null
        }
      >
        <LeadGenerationFilters defaults={filters} action={STOCK_FORM_ACTION} />
      </CollapsibleSection>

      {filterNotice ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground">
          {filterNotice}
        </p>
      ) : null}

      <Suspense fallback={<TableSkeleton rows={5} cols={6} />}>
        <LeadGenerationStockListBlockAsync
          filters={filters}
          filtersForQuery={filtersForQuery}
          page={page}
          linkBase={linkBase}
          activeStockChip={activeStockChip}
          activeDispatchChip={activeDispatchChip}
          listEmptyHint={
            hasActiveFilters
              ? "Aucune fiche ne correspond à ces critères. Ajustez les filtres ou le lot."
              : undefined
          }
        />
      </Suspense>

      <CollapsibleSection
        title="Outils avancés"
        icon={<Wrench className="size-4" aria-hidden />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Détection de doublons sur le stock — utile en maintenance, rarement au quotidien.
          </p>
          <LeadGenerationDuplicateScanPanel />
        </div>
      </CollapsibleSection>
    </div>
  );
}
