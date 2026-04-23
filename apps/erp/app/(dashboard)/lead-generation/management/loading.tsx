import { KpiCardSkeletonGrid } from "@/components/shared/kpi-card-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function LeadGenerationManagementRouteLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <KpiCardSkeletonGrid count={5} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <TableSkeleton rows={3} cols={4} />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-56" />
        <div className={cn("grid gap-3 sm:grid-cols-2")}>
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
