import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type TechnicalVisitsViewToggleProps = {
  hrefList: string;
  hrefMap: string;
  current: "list" | "map";
};

export function TechnicalVisitsViewToggle({ hrefList, hrefMap, current }: TechnicalVisitsViewToggleProps) {
  return (
    <div
      className="flex w-full rounded-lg border border-border bg-muted/30 p-1 sm:inline-flex sm:w-auto"
      role="tablist"
      aria-label="Affichage des visites techniques"
    >
      <Link
        href={hrefList}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 flex-1 justify-center rounded-md px-4 touch-manipulation sm:min-h-9 sm:flex-initial",
          current === "list" && "bg-background shadow-sm",
        )}
        aria-current={current === "list" ? "true" : undefined}
      >
        Liste
      </Link>
      <Link
        href={hrefMap}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 flex-1 justify-center rounded-md px-4 touch-manipulation sm:min-h-9 sm:flex-initial",
          current === "map" && "bg-background shadow-sm",
        )}
        aria-current={current === "map" ? "true" : undefined}
      >
        Carte
      </Link>
    </div>
  );
}
