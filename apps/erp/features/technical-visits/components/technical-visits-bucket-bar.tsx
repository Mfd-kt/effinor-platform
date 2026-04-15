import Link from "next/link";

import { buildTechnicalVisitsListUrl } from "@/features/technical-visits/lib/build-technical-visits-list-url";
import type { TechnicalVisitListBucket } from "@/features/technical-visits/lib/technical-visit-list-bucket";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const BUCKET_ORDER_MAIN: readonly TechnicalVisitListBucket[] = [
  "active",
  "today",
  "upcoming",
  "in_progress",
  "to_fix",
  "validated",
  "all",
] as const;

const BUCKET_LABELS: Record<TechnicalVisitListBucket, string> = {
  active: "À faire",
  all: "Toutes",
  today: "Aujourd’hui",
  upcoming: "À venir",
  in_progress: "En cours",
  to_fix: "À rectifier",
  validated: "Validées",
  other: "Autres",
};

type UrlBase = {
  q?: string;
  status?: string;
  lead_id?: string;
  view?: "list" | "map";
};

type TechnicalVisitsBucketBarProps = {
  current: TechnicalVisitListBucket;
  counts: Record<TechnicalVisitListBucket, number>;
  urlBase: UrlBase;
};

export function TechnicalVisitsBucketBar({ current, counts, urlBase }: TechnicalVisitsBucketBarProps) {
  const showOther = counts.other > 0;
  const keys: TechnicalVisitListBucket[] = showOther
    ? [...BUCKET_ORDER_MAIN, "other" as const]
    : [...BUCKET_ORDER_MAIN];

  return (
    <div
      className="mb-4 -mx-1 overflow-x-auto px-1 pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Regroupement des visites techniques"
    >
      <div className="flex min-w-min snap-x snap-mandatory gap-2 pb-0.5 sm:flex-wrap sm:snap-none">
        {keys.map((bucket) => {
          const href = buildTechnicalVisitsListUrl({ ...urlBase, bucket });
          const n = counts[bucket];
          const label = BUCKET_LABELS[bucket];
          const active = current === bucket;
          return (
            <Link
              key={bucket}
              href={href}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
                "min-h-11 shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-medium touch-manipulation sm:min-h-10 sm:px-3.5 sm:py-2",
                active && "pointer-events-none",
                bucket === "to_fix" &&
                  !active &&
                  n > 0 &&
                  "border-amber-500/50 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-50 dark:hover:bg-amber-950/45",
              )}
              aria-current={active ? "true" : undefined}
            >
              {label}
              <span className={cn("ml-1.5 tabular-nums opacity-80", active && "opacity-90")}>({n})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
