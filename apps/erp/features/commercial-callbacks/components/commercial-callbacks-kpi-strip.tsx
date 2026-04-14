import { AlarmClock, CalendarClock, CheckCircle2, TriangleAlert } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";

import type {
  CallbackPerformanceStats,
  CommercialCallbackKpis,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";

function pct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n * 100)} %`;
}

export function CommercialCallbacksKpiStrip({
  kpis,
  performance,
}: {
  kpis: CommercialCallbackKpis;
  performance: CallbackPerformanceStats;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aujourd'hui"
          value={kpis.dueToday}
          hint="Rappels actifs prévus ce jour"
          icon={<CalendarClock className="size-4" />}
        />
        <StatCard
          title="En retard"
          value={kpis.overdue}
          hint="Échéance dépassée"
          icon={<TriangleAlert className="size-4" />}
        />
        <StatCard
          title="À venir (7 j.)"
          value={kpis.upcoming}
          hint="Hors aujourd'hui, sous 7 jours"
          icon={<AlarmClock className="size-4" />}
        />
        <StatCard
          title="Terminés aujourd'hui"
          value={kpis.completedToday}
          hint="Clôturés ou convertis ce jour"
          icon={<CheckCircle2 className="size-4" />}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Performance (liste courante) : conversion {pct(performance.conversionRate)} · sans réponse / froid{" "}
        {pct(performance.noAnswerOrColdShare)} · traités aujourd’hui {performance.treatedToday}
      </p>
    </div>
  );
}
