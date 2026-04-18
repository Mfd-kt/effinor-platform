import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationStockLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader title="Stock leads" description="Chargement…" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
