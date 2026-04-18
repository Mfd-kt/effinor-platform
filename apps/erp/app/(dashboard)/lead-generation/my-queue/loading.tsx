import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyLeadGenerationQueueLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader title="Mes fiches à traiter" description="Chargement…" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
