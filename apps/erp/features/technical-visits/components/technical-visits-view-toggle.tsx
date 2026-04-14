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
      className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
      role="tablist"
      aria-label="Affichage des visites techniques"
    >
      <Link
        href={hrefList}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "rounded-md px-4",
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
          "rounded-md px-4",
          current === "map" && "bg-background shadow-sm",
        )}
        aria-current={current === "map" ? "true" : undefined}
      >
        Carte
      </Link>
    </div>
  );
}
