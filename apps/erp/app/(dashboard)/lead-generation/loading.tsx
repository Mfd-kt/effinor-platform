import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeader
        titleClassName="text-3xl font-semibold tracking-tight sm:text-4xl"
        title="Lead Generation"
        description={<span className="text-sm text-muted-foreground">Chargement…</span>}
      />
      <Skeleton className="h-44 w-full rounded-2xl bg-muted/40" />
      <Skeleton className="h-56 w-full rounded-2xl bg-muted/40" />
    </div>
  );
}
