import { LeadGenerationStockKpis } from "@/features/lead-generation/components/lead-generation-stock-kpis";
import type { GetLeadGenerationStockFilters } from "@/features/lead-generation/queries/get-lead-generation-stock";
import { getLeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";

type Props = {
  filtersForQuery: GetLeadGenerationStockFilters | undefined;
  hasActiveFilters: boolean;
};

export async function LeadGenerationStockKpisSectionAsync({ filtersForQuery, hasActiveFilters }: Props) {
  try {
    const summary = await getLeadGenerationStockSummary(filtersForQuery);
    return <LeadGenerationStockKpis summary={summary} filtered={hasActiveFilters} />;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur indicateurs stock.";
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {message}
      </p>
    );
  }
}
