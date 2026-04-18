import { Loader2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import type { LeadGenerationImportBatchListItem } from "@/features/lead-generation/queries/get-lead-generation-import-batches";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  batches: LeadGenerationImportBatchListItem[];
};

/**
 * Bandeau sous le cockpit : lots d’import encore en cours (synchronisation Apify / coordinateur).
 */
export function LeadGenerationSyncingImportsBanner({ batches }: Props) {
  return (
    <section
      className="rounded-xl border border-border/80 bg-card/50 px-4 py-3 shadow-sm"
      aria-label="Imports en cours de synchronisation"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lots en synchronisation
        </h2>
        <Link
          href="/lead-generation/imports"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-7 text-xs text-muted-foreground hover:text-foreground",
          )}
        >
          Voir tous les imports
        </Link>
      </div>

      {batches.length === 0 ? (
        <p className="pt-2 text-sm text-muted-foreground">Aucun lot en cours pour l’instant.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {batches.map((b) => {
            const title = b.source_label?.trim() || formatLeadGenerationSourceLabel(b.source);
            const sourceKind = formatLeadGenerationSourceLabel(b.source);
            const started = b.started_at ? formatDateTimeFr(b.started_at) : "—";
            const ext = b.external_status?.trim();

            return (
              <li
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <Loader2
                    className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {sourceKind}
                      {ext ? ` · statut externe : ${ext}` : null}
                      {` · démarré ${started}`}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/lead-generation/imports/${b.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "shrink-0 text-xs",
                  )}
                >
                  Détails
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
