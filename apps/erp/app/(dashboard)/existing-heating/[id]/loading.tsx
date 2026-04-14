import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExistingHeatingDetailLoading() {
  return (
    <div>
      <PageHeader title="Chauffage existant" description="Chargement…" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="mb-8 h-36 w-full max-w-4xl rounded-xl" />
      <div className="mt-8 max-w-4xl space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
