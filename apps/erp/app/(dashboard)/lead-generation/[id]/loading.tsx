import { Skeleton } from "@/components/ui/skeleton";

export default function LeadGenerationDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-4">
      <Skeleton className="h-10 w-2/3 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
