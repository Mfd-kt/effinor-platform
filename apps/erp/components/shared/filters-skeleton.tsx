import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FiltersSkeletonProps = {
  /** Nombre de pseudo champs côte à côte */
  fields?: number;
  className?: string;
};

/**
 * Barre de filtres type formulaire (hauteur input `h-9` alignée shadcn).
 */
export function FiltersSkeleton({ fields = 4, className }: FiltersSkeletonProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)} aria-hidden>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="grid gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-[180px] rounded-md" />
        </div>
      ))}
    </div>
  );
}
