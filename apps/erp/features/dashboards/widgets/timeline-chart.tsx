"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TimelinePoint = {
  /** Date ISO ou label court ("L", "M"…). */
  date: string;
  /** Une ou plusieurs séries numériques (clé = nom de série). */
  [series: string]: string | number;
};

export type TimelineSeries = {
  key: string;
  label: string;
  color: string;
};

type Props = {
  points: TimelinePoint[];
  series: TimelineSeries[];
  /** Format d'affichage des dates en abscisse. Défaut : passe la valeur telle quelle. */
  formatDate?: (raw: string) => string;
};

/**
 * Évolution temporelle multi-séries (line chart).
 * Légende compacte affichée au-dessus du chart par le parent.
 */
export function TimelineChart({ points, series, formatDate }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatDate}
          tick={{ fill: "currentColor", fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          tick={{ fill: "currentColor", fontSize: 11 }}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(label) => (formatDate ? formatDate(String(label)) : String(label))}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Légende compacte à afficher au-dessus du graph (côté serveur ou client). */
export function TimelineLegend({ series }: { series: TimelineSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: s.color }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}
