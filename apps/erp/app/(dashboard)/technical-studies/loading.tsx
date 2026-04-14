import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function TechnicalStudiesLoading() {
  return (
    <div>
      <PageHeader
        title="Études techniques"
        description="NDD, études d’éclairage, analyses — rattachées aux opérations et sites."
      />
      <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 min-w-[200px] flex-1" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
