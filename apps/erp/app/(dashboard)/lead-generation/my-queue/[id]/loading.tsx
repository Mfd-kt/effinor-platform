import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyLeadGenerationStockLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <PageHeader title="Fiche" description="Chargement…" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-56 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
