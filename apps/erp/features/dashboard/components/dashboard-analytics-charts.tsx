"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CockpitChartSeries } from "@/features/dashboard/queries/get-dashboard-metrics";
import { cn } from "@/lib/utils";

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur-sm dark:bg-card/30",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 h-[300px] w-full min-w-0">{children}</div>
    </div>
  );
}

/** Volume de leads sur la **même** fenêtre que le sélecteur `period` du cockpit (agrégation serveur). */
export function DashboardAnalyticsCharts({ charts }: { charts: CockpitChartSeries }) {
  const tickStyle = { fill: "#64748b", fontSize: 11 };
  const { title, description, points } = charts.leadVolume;
  const dense = points.length > 14;

  return (
    <section className="mb-10 space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Graphiques</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Nouveaux leads — découpage aligné sur la période active (Europe/Paris). Pas d’autre fenêtre temporelle
          cachée.
        </p>
      </div>
      <ChartCard title={title} description={description} className="lg:col-span-2">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 300 }}>
          <BarChart
            data={points}
            margin={{ top: 8, right: 8, left: 0, bottom: dense ? 48 : 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis
              dataKey="label"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              interval={dense ? 0 : "preserveStartEnd"}
              angle={dense ? -35 : 0}
              textAnchor={dense ? "end" : "middle"}
              height={dense ? 48 : 24}
            />
            <YAxis allowDecimals={false} width={32} tick={tickStyle} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value ?? 0}`, "Nouveaux leads"]}
            />
            <Bar dataKey="value" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
