"use client";

import { useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import {
  type MyQueueQuickFilter,
  computeQueueKpis,
  itemMatchesQuickFilter,
} from "../lib/my-queue-follow-up";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";
import { MyLeadGenerationQueueReloadButton } from "./my-lead-generation-queue-reload-button";
import { MyLeadGenerationQueueTable } from "./my-lead-generation-queue-table";

const FILTERS: { id: MyQueueQuickFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "overdue", label: "Rappels en retard" },
  { id: "today", label: "À appeler aujourd'hui" },
  { id: "high_priority", label: "Priorité haute" },
  { id: "ready_now", label: "Prêt maintenant" },
];

type Props = {
  items: MyLeadGenerationQueueItem[];
};

export function MyLeadGenerationQueueWorkbench({ items }: Props) {
  const [filter, setFilter] = useState<MyQueueQuickFilter>("all");
  const activeStockCount = useMemo(() => computeQueueKpis(items).active, [items]);

  const filtered = useMemo(
    () => items.filter((i) => itemMatchesQuickFilter(i, filter)),
    [items, filter],
  );

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">À traiter</h2>
          <MyLeadGenerationQueueReloadButton activeStockCount={activeStockCount} />
        </div>
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Rien à traiter pour le moment. Vous pouvez récupérer des fiches depuis le carnet « prêt maintenant » avec le
          bouton ci-dessus.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:min-w-0 lg:flex-1">
          <h2 className="text-sm font-semibold">À traiter</h2>
          {filter !== "all" ? (
            <p className="text-xs text-muted-foreground">
              {filtered.length} fiche{filtered.length > 1 ? "s" : ""} sur {items.length}
            </p>
          ) : null}
        </div>
        <MyLeadGenerationQueueReloadButton activeStockCount={activeStockCount} className="shrink-0 lg:pt-0.5" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                buttonVariants({
                  variant: active ? "default" : "outline",
                  size: "sm",
                }),
                "h-8 rounded-full text-xs font-medium",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune fiche ne correspond à ce filtre.
        </p>
      ) : (
        <MyLeadGenerationQueueTable items={filtered} />
      )}
    </section>
  );
}
