import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  cols?: number;
  className?: string;
  /** Avec ou sans en-têtes de colonnes (meilleur relief visuel) */
  showHeader?: boolean;
};

/**
 * Squelette de tableau aligné sur la `Table` shadcn (overflow-x + bordure).
 */
export function TableSkeleton({
  rows = 5,
  cols = 6,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div
      className={cn("overflow-x-auto rounded-lg border border-border/80 bg-card", className)}
      aria-hidden
    >
      <div className="w-full min-w-[640px]">
        {showHeader ? (
          <div
            className="grid border-b border-border/60 bg-muted/40 px-3 py-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: cols }, (_, c) => (
              <Skeleton key={c} className="h-3 w-20" />
            ))}
          </div>
        ) : null}
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }, (_, r) => (
            <div
              key={r}
              className="grid items-center gap-2 px-3 py-2.5"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
            >
              {Array.from({ length: cols }, (_, c) => (
                <Skeleton key={c} className={c === 0 ? "h-4 w-40" : "h-3 w-24"} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
