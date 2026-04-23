import Link from "next/link";

import { cn } from "@/lib/utils";

import { TrendIndicator } from "../shared/trend-indicator";
import type { Trend } from "../shared/types";

export type TeamPerformanceRow = {
  id: string;
  name: string;
  /** Sous-libellé sous le nom (rôle, équipe, email…). */
  subtitle?: string;
  /** Métrique principale (ex. nombre d'accords). */
  primaryValue: string | number;
  /** Métrique secondaire (ex. taux de conversion). */
  secondaryValue?: string;
  trend?: Trend;
  /** Lien vers la fiche agent. */
  href?: string;
  /** Tag visuel (ex. "Top", "À coacher"). */
  tag?: { label: string; tone: "positive" | "negative" | "neutral" };
};

type Props = {
  rows: TeamPerformanceRow[];
  primaryLabel: string;
  secondaryLabel?: string;
};

const TAG_TONE = {
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * Tableau compact de performance par membre d'équipe.
 * Pas de pagination interne — passer un tableau pré-trié et limité (top 5 / bottom 5).
 */
export function TeamPerformanceTable({ rows, primaryLabel, secondaryLabel }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Aucun membre à afficher
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Agent</th>
            <th className="px-3 py-2 text-right font-medium">{primaryLabel}</th>
            {secondaryLabel ? (
              <th className="px-3 py-2 text-right font-medium">{secondaryLabel}</th>
            ) : null}
            <th className="px-3 py-2 text-right font-medium">Tendance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const cellClass = cn("flex min-w-0 flex-col", row.href && "hover:underline");
            const cellInner = (
              <>
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{row.name}</span>
                  {row.tag ? (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        TAG_TONE[row.tag.tone],
                      )}
                    >
                      {row.tag.label}
                    </span>
                  ) : null}
                </span>
                {row.subtitle ? (
                  <span className="truncate text-xs text-muted-foreground">{row.subtitle}</span>
                ) : null}
              </>
            );
            return (
              <tr key={row.id} className="bg-card hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  {row.href ? (
                    <Link href={row.href} className={cellClass}>
                      {cellInner}
                    </Link>
                  ) : (
                    <div className={cellClass}>{cellInner}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                  {row.primaryValue}
                </td>
                {secondaryLabel ? (
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.secondaryValue ?? "—"}
                  </td>
                ) : null}
                <td className="px-3 py-2.5 text-right">
                  {row.trend ? <TrendIndicator trend={row.trend} /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
