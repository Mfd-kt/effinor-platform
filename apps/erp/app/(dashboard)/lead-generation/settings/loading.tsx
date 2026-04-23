import { KpiCardSkeletonGrid } from "@/components/shared/kpi-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationSettingsRouteLoading() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-64" />
        <KpiCardSkeletonGrid count={4} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md border" />
        <Skeleton className="h-10 w-full rounded-md border" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}
