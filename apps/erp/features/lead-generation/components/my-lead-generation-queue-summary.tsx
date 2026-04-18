import { computeQueueKpis } from "../lib/my-queue-follow-up";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";

type Props = {
  items: MyLeadGenerationQueueItem[];
};

export function MyLeadGenerationQueueSummary({ items }: Props) {
  const { active, overdue, dueToday, highPriority } = computeQueueKpis(items);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">Fiches actives</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{active}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Dans votre file</p>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4 dark:bg-red-500/[0.06]">
        <p className="text-xs font-medium text-muted-foreground">Rappels en retard</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">{overdue}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Date de relance dépassée</p>
      </div>
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-4 dark:bg-amber-500/[0.07]">
        <p className="text-xs font-medium text-muted-foreground">À appeler aujourd&apos;hui</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-800 dark:text-amber-200">{dueToday}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Relance prévue aujourd&apos;hui</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">Priorité haute</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{highPriority}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Critique ou élevée</p>
      </div>
    </div>
  );
}
