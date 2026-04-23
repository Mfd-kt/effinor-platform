import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Reproduit la structure d’une `StatCard` / KPI (titre, valeur, hint) pour
 * les états de chargement. Variante grille : `KpiCardSkeletonGrid`.
 */
function KpiCardSkeleton() {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-4 w-4 shrink-0 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mt-2 h-3 w-40" />
      </CardContent>
    </Card>
  );
}

type KpiCardSkeletonGridProps = {
  /** Nombre de cartes (ex. 4 stock/imports, 5 pilotage suivi) */
  count: number;
  className?: string;
};

const GRID_4 = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
const GRID_5 = "grid gap-3 sm:grid-cols-2 lg:grid-cols-5";

export function KpiCardSkeletonGrid({ count, className }: KpiCardSkeletonGridProps) {
  const gridClass = count === 5 ? GRID_5 : GRID_4;
  return (
    <div className={cn(gridClass, className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { KpiCardSkeleton };
