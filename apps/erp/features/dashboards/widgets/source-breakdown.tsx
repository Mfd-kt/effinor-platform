"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type SourceSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: SourceSlice[];
  /** Libellé central (ex. "1 248" total). */
  centerLabel?: string;
  centerSublabel?: string;
};

/**
 * Donut chart pour répartition par source / catégorie.
 * Légende latérale rendue par le parent ou via `<SourceBreakdownLegend>`.
 */
export function SourceBreakdown({ slices, centerLabel, centerSublabel }: Props) {
  if (slices.length === 0 || slices.every((s) => s.value === 0)) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) =>
              typeof value === "number" ? value.toLocaleString("fr-FR") : String(value)
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-semibold tabular-nums text-foreground">{centerLabel}</span>
          {centerSublabel ? (
            <span className="text-xs text-muted-foreground">{centerSublabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SourceBreakdownLegend({ slices }: { slices: SourceSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return (
    <ul className="space-y-1.5 text-xs">
      {slices.map((s) => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
        return (
          <li key={s.key} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 truncate">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-foreground">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {s.value.toLocaleString("fr-FR")} · {pct} %
            </span>
          </li>
        );
      })}
    </ul>
  );
}
