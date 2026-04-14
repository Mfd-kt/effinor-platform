import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExistingHeatingLoading() {
  return (
    <div>
      <PageHeader
        title="Chauffage existant"
        description="Unités observées sur site, liées aux modèles catalogue."
      />
      <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 min-w-[200px] flex-1" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
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
