import { FiltersSkeleton } from "@/components/shared/filters-skeleton";
import { KpiCardSkeletonGrid } from "@/components/shared/kpi-card-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationRouteLoading() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-4 w-full max-w-md" />
      <KpiCardSkeletonGrid count={4} />
      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <FiltersSkeleton fields={3} />
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
