import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyLeadGenerationQueueRouteLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
