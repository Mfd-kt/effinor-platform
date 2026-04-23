import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationStockListView } from "@/features/lead-generation/components/lead-generation-stock-list-view";
import { buildLeadGenerationStockPageUrl, type LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import {
  getLeadGenerationStock,
  type GetLeadGenerationStockFilters,
} from "@/features/lead-generation/queries/get-lead-generation-stock";
import { getLeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

type Props = {
  filters: LeadGenerationListSearchState;
  filtersForQuery: GetLeadGenerationStockFilters | undefined;
  page: number;
  linkBase: LeadGenerationListSearchState;
  activeStockChip?: string;
  activeDispatchChip?: string;
  listEmptyHint?: string;
};

/**
 * Chargement liste + bandeau synthèse (tableau). La summary est en cache
 * partagé avec `LeadGenerationStockKpisSectionAsync` si les deux
 * s’exécutent en parallèle.
 */
export async function LeadGenerationStockListBlockAsync({
  filters,
  filtersForQuery,
  page,
  linkBase,
  activeStockChip,
  activeDispatchChip,
  listEmptyHint,
}: Props) {
  let rows: Awaited<ReturnType<typeof getLeadGenerationStock>>;
  let summary: Awaited<ReturnType<typeof getLeadGenerationStockSummary>>;
  try {
    [rows, summary] = await Promise.all([
      getLeadGenerationStock({
        filters: filtersForQuery,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      getLeadGenerationStockSummary(filtersForQuery),
    ]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement du stock.";
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {message}
      </p>
    );
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === PAGE_SIZE;
  const prevHref = hasPrev ? buildLeadGenerationStockPageUrl({ ...filters, page: page - 1 }) : null;
  const nextHref = hasNext ? buildLeadGenerationStockPageUrl({ ...filters, page: page + 1 }) : null;

  return (
    <>
      <LeadGenerationStockListView
        rows={rows}
        summary={summary}
        page={page}
        pageSize={PAGE_SIZE}
        linkBase={linkBase}
        activeStockChip={activeStockChip}
        activeDispatchChip={activeDispatchChip}
        emptyHint={listEmptyHint}
      />

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
    </>
  );
}
