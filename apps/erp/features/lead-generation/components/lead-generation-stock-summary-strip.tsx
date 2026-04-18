import Link from "next/link";

import {
  buildLeadGenerationStockPageUrl,
  type LeadGenerationListSearchState,
} from "@/features/lead-generation/lib/build-lead-generation-list-url";
import type { LeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";
import { cn } from "@/lib/utils";

const STOCK_LABELS: Record<string, string> = {
  new: "Nouveau",
  ready: "Prêt",
  assigned: "Attribué",
  in_progress: "En cours",
  converted: "Converti",
  rejected: "Rejeté",
  expired: "Expiré",
  archived: "Archivé",
};

const DISPATCH_LABELS: Record<string, string> = {
  ready_now: "Prêt maintenant",
  enrich_first: "À enrichir",
  review: "À revoir",
  low_value: "Faible valeur",
  do_not_dispatch: "Ne pas diffuser",
};

type Props = {
  summary: LeadGenerationStockSummary;
  page: number;
  pageSize: number;
  rowCountOnPage: number;
  /** Paramètres URL courants (hors pagination) pour préserver recherche / ville / lot. */
  linkBase: LeadGenerationListSearchState;
  activeStockChip?: string;
  activeDispatchChip?: string;
};

export function LeadGenerationStockSummaryStrip({
  summary,
  page,
  pageSize,
  rowCountOnPage,
  linkBase,
  activeStockChip,
  activeDispatchChip,
}: Props) {
  const { totalMatching, byStockStatus, byDispatchQueue } = summary;
  const stockEntries = Object.entries(byStockStatus).sort((a, b) => b[1] - a[1]);
  const dispatchEntries = Object.entries(byDispatchQueue).sort((a, b) => b[1] - a[1]);

  const baseForChips: LeadGenerationListSearchState = {
    ...linkBase,
    filtre: undefined,
    page: undefined,
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-foreground">
          {totalMatching} fiche{totalMatching > 1 ? "s" : ""} au total
          {totalMatching > 0 ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              — page {page} : {rowCountOnPage} affichée{rowCountOnPage > 1 ? "s" : ""}
              {pageSize > 0 ? ` (max ${pageSize} / page)` : ""}
            </span>
          ) : null}
        </p>
      </div>
      {stockEntries.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Par statut stock</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {stockEntries.map(([k, n]) => {
              const href = buildLeadGenerationStockPageUrl({
                ...baseForChips,
                page: 1,
                stock_status: k,
              });
              const active = activeStockChip === k;
              return (
                <li key={k}>
                  <Link
                    href={href}
                    scroll={false}
                    className={cn(
                      "inline-flex rounded-md border border-border/80 bg-background/80 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-muted/60",
                      active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    title={`Filtrer par statut stock : ${STOCK_LABELS[k] ?? k}`}
                  >
                    <span className="text-muted-foreground">{STOCK_LABELS[k] ?? k} :</span>{" "}
                    <span className="tabular-nums font-medium">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {dispatchEntries.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Par file de dispatch</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {dispatchEntries.map(([k, n]) => {
              const href = buildLeadGenerationStockPageUrl({
                ...baseForChips,
                page: 1,
                dispatch_queue_status: k,
              });
              const active = activeDispatchChip === k;
              return (
                <li key={k}>
                  <Link
                    href={href}
                    scroll={false}
                    className={cn(
                      "inline-flex rounded-md border border-border/80 bg-background/80 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-muted/60",
                      active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    title={`Filtrer par file : ${DISPATCH_LABELS[k] ?? k}`}
                  >
                    <span className="text-muted-foreground">{DISPATCH_LABELS[k] ?? k} :</span>{" "}
                    <span className="tabular-nums font-medium">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
