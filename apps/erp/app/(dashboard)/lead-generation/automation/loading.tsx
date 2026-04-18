import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationAutomationLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader title="Automatisations" description="Chargement…" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
