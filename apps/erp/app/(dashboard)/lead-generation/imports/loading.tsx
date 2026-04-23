import { KpiCardSkeletonGrid } from "@/components/shared/kpi-card-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationImportsRouteLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <KpiCardSkeletonGrid count={4} />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    </div>
  );
}
