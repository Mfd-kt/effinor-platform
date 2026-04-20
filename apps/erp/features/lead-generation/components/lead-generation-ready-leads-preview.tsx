import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  buildLeadGenerationStockPageUrl,
  buildLeadGenerationStockQuickFiltreUrl,
} from "@/features/lead-generation/lib/build-lead-generation-list-url";
import type { LeadGenerationStockListItem } from "@/features/lead-generation/queries/get-lead-generation-stock";
import { cn } from "@/lib/utils";

import { LeadGenerationPremiumLeadBadge } from "./lead-generation-premium-badges";

type Props = {
  rows: LeadGenerationStockListItem[];
};

/** Aperçu compact : fiches classées « prêt maintenant » (priorité contact). */
export function LeadGenerationReadyLeadsPreview({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune fiche en priorité contact pour l’instant.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-background/30"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/lead-generation/${r.id}`}
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              {r.company_name}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span>
                {[r.city, r.commercial_score != null ? `score ${r.commercial_score}` : null]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </span>
              {r.lead_tier === "premium" ? <LeadGenerationPremiumLeadBadge tier="premium" compact /> : null}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LeadGenerationStockFullLink({ className }: { className?: string }) {
  return (
    <Link
      href={buildLeadGenerationStockPageUrl({})}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "border-border/80 bg-transparent font-medium text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      Voir tout le stock
    </Link>
  );
}

export function LeadGenerationStockQuickLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link
        href={buildLeadGenerationStockQuickFiltreUrl("pret")}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-border/80 bg-transparent font-medium",
        )}
      >
        Prêts à contacter
      </Link>
      <Link
        href={buildLeadGenerationStockQuickFiltreUrl("enrichir")}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-border/80 bg-transparent font-medium",
        )}
      >
        À enrichir
      </Link>
      <Link
        href={buildLeadGenerationStockQuickFiltreUrl("contact_gap")}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-amber-500/35 bg-amber-500/[0.06] font-medium text-amber-950 dark:text-amber-100",
        )}
      >
        Non traitées (email/site)
      </Link>
      <Link
        href={buildLeadGenerationStockQuickFiltreUrl("rejet")}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-border/80 bg-transparent font-medium",
        )}
      >
        Rejetés
      </Link>
      <Link
        href={buildLeadGenerationStockQuickFiltreUrl("premium")}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-violet-500/30 bg-violet-500/[0.06] font-medium text-violet-950 dark:text-violet-100",
        )}
      >
        Premium
      </Link>
    </div>
  );
}
