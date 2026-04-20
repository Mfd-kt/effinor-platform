"use client";

import { LeadGenerationStockSummaryStrip } from "@/features/lead-generation/components/lead-generation-stock-summary-strip";
import { LeadGenerationStockTable } from "@/features/lead-generation/components/lead-generation-stock-table";
import type { LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import type { LeadGenerationStockListItem } from "@/features/lead-generation/queries/get-lead-generation-stock";
import type { LeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";

type Props = {
  rows: LeadGenerationStockListItem[];
  summary: LeadGenerationStockSummary;
  page: number;
  pageSize: number;
  linkBase: LeadGenerationListSearchState;
  activeStockChip?: string;
  activeDispatchChip?: string;
  /** Texte sous le tableau si aucune ligne (p.ex. import vide). */
  emptyHint?: string;
};

/**
 * Liste stock : synthèse + tableau — sans enrichissement / scoring / dispatch groupé (flux qualificateur).
 */
export function LeadGenerationStockListView({
  rows,
  summary,
  page,
  pageSize,
  linkBase,
  activeStockChip,
  activeDispatchChip,
  emptyHint,
}: Props) {
  return (
    <div className="space-y-3">
      <LeadGenerationStockSummaryStrip
        summary={summary}
        page={page}
        pageSize={pageSize}
        rowCountOnPage={rows.length}
        linkBase={linkBase}
        activeStockChip={activeStockChip}
        activeDispatchChip={activeDispatchChip}
      />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
          {emptyHint ?? "Aucune fiche pour ces critères."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <LeadGenerationStockTable rows={rows} />
        </div>
      )}
    </div>
  );
}
