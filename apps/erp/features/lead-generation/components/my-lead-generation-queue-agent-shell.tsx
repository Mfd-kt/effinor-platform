"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { LeadGenerationMyQueueCeeSheetOption } from "../lib/my-queue-cee-sheet-option";
import {
  formatMyQueueCeeSheetOptionLabel,
  MY_QUEUE_NO_CEE_SHEET_SENTINEL,
} from "../lib/my-queue-cee-sheet-option";
import {
  readMyQueueSelectedCeeSheetId,
  writeMyQueueSelectedCeeSheetId,
} from "../lib/my-queue-cee-sheet-preference";
import {
  type MyQueueQuickFilter,
  computeQueueKpis,
  itemMatchesQuickFilter,
  sortQueueItems,
} from "../lib/my-queue-follow-up";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";
import {
  MyLeadQueueCeeSheetPicker,
  MyLeadQueueReadyPoolFetchButton,
} from "./my-lead-generation-queue-reload-button";
import { MyLeadGenerationQueueTable } from "./my-lead-generation-queue-table";

const FILTERS: { id: MyQueueQuickFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "pipeline_new", label: "Nouveau (stock)" },
  { id: "pipeline_contacted", label: "Contacté / En action" },
  { id: "pipeline_follow_up", label: "À rappeler" },
  { id: "overdue", label: "Rappels en retard" },
  { id: "today", label: "À appeler aujourd’hui" },
  { id: "high_priority", label: "Priorité haute" },
  { id: "ready_now", label: "Priorité file" },
];

type Props = {
  items: MyLeadGenerationQueueItem[];
  ceeSheetOptions: LeadGenerationMyQueueCeeSheetOption[];
  viewerUserId: string;
  /** Plafond effectif aligné sur {@link getLeadGenerationDispatchPolicy} (dispatch réel). */
  effectiveStockCap: number;
};

export function MyLeadGenerationQueueAgentShell({
  items,
  ceeSheetOptions,
  viewerUserId,
  effectiveStockCap,
}: Props) {
  const [filter, setFilter] = useState<MyQueueQuickFilter>("all");
  const [selectedCeeSheetId, setSelectedCeeSheetId] = useState("");

  const needsCeePick = ceeSheetOptions.length > 0;
  const optionIdsKey = useMemo(
    () => [...ceeSheetOptions.map((o) => o.id)].sort().join("\0"),
    [ceeSheetOptions],
  );

  useLayoutEffect(() => {
    if (ceeSheetOptions.length === 0) {
      setSelectedCeeSheetId("");
      return;
    }

    setSelectedCeeSheetId((prev) => {
      if (prev && (ceeSheetOptions.some((o) => o.id === prev) || prev === MY_QUEUE_NO_CEE_SHEET_SENTINEL)) {
        return prev;
      }
      const stored = readMyQueueSelectedCeeSheetId(viewerUserId);
      if (
        stored &&
        (ceeSheetOptions.some((o) => o.id === stored) || stored === MY_QUEUE_NO_CEE_SHEET_SENTINEL)
      ) {
        return stored;
      }
      return "";
    });
  }, [viewerUserId, optionIdsKey, ceeSheetOptions]);

  useLayoutEffect(() => {
    if (!viewerUserId.trim() || !selectedCeeSheetId.trim()) {
      return;
    }
    if (selectedCeeSheetId === MY_QUEUE_NO_CEE_SHEET_SENTINEL) {
      writeMyQueueSelectedCeeSheetId(viewerUserId, MY_QUEUE_NO_CEE_SHEET_SENTINEL);
      return;
    }
    if (ceeSheetOptions.some((o) => o.id === selectedCeeSheetId)) {
      writeMyQueueSelectedCeeSheetId(viewerUserId, selectedCeeSheetId);
    }
  }, [viewerUserId, selectedCeeSheetId, optionIdsKey, ceeSheetOptions]);

  const isNoCeeSelected = selectedCeeSheetId.trim() === MY_QUEUE_NO_CEE_SHEET_SENTINEL;

  const selectedOption = useMemo(
    () => ceeSheetOptions.find((o) => o.id === selectedCeeSheetId.trim()) ?? null,
    [ceeSheetOptions, selectedCeeSheetId],
  );

  const hasValidSelection = Boolean(selectedOption) || isNoCeeSelected;

  const globalFreshStock = useMemo(() => computeQueueKpis(items).freshStock, [items]);

  const itemsInCeeScope = useMemo(() => {
    if (!needsCeePick) {
      return items;
    }
    if (isNoCeeSelected) {
      return items.filter((i) => !i.ceeSheetId);
    }
    if (!selectedOption) {
      return [];
    }
    return items.filter((i) => i.ceeSheetId === selectedOption.id);
  }, [items, needsCeePick, isNoCeeSelected, selectedOption]);

  const freshInScope = computeQueueKpis(itemsInCeeScope).freshStock;

  const stockForPlafond = isNoCeeSelected ? globalFreshStock : freshInScope;

  const kpiItems = itemsInCeeScope;
  const kpis = useMemo(() => computeQueueKpis(kpiItems), [kpiItems]);

  const maxCap = effectiveStockCap;
  const placesLeft = Math.max(0, maxCap - Math.max(0, stockForPlafond));

  const filteredTableRows = useMemo(() => {
    const filtered = itemsInCeeScope.filter((i) => itemMatchesQuickFilter(i, filter));
    return sortQueueItems(filtered);
  }, [itemsInCeeScope, filter]);

  const showCeeColumn = !needsCeePick;

  const scopeTitle = useMemo(() => {
    if (!needsCeePick) return null;
    if (!hasValidSelection) return null;
    if (isNoCeeSelected) return "Sans fiche CEE";
    if (selectedOption) return formatMyQueueCeeSheetOptionLabel(selectedOption);
    return null;
  }, [needsCeePick, hasValidSelection, isNoCeeSelected, selectedOption]);

  const fetchStock = needsCeePick ? stockForPlafond : globalFreshStock;

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm sm:p-5",
          "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        )}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Votre file</span> — liste des contacts qui vous sont attribués.
          Le filtre produit ci-dessous limite l’affichage par fiche CEE. Seul le statut pipeline{" "}
          <span className="font-medium text-foreground">Nouveau</span> compte pour votre stock disponible au sens plafond /
          réinjection ; le reste est du suivi.
        </p>
        {needsCeePick && !hasValidSelection ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/[0.09] dark:text-amber-100">
            Choisissez un <span className="font-semibold">produit CEE</span> (ou « sans fiche CEE ») pour afficher votre
            liste et vos indicateurs.
          </p>
        ) : null}

        <MyLeadQueueCeeSheetPicker
          ceeSheetOptions={ceeSheetOptions}
          selectedCeeSheetId={selectedCeeSheetId}
          onSelectedCeeSheetIdChange={setSelectedCeeSheetId}
          viewerUserId={viewerUserId}
          ceeSelectionMandatory={needsCeePick}
          effectiveStockCap={effectiveStockCap}
        />
      </section>

      {needsCeePick && !hasValidSelection ? null : (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Vos prospections à appeler</h2>
            {filter !== "all" ? (
              <p className="text-xs text-muted-foreground">
                {filteredTableRows.length} fiche{filteredTableRows.length > 1 ? "s" : ""} sur {itemsInCeeScope.length}
              </p>
            ) : null}
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

          {filteredTableRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {itemsInCeeScope.length === 0
                ? isNoCeeSelected
                  ? "Aucun contact dans ce périmètre. Récupérez des fiches disponibles ci-dessous si des places restent."
                  : "Aucun contact dans votre file pour ce produit. Utilisez le bouton de récupération si des fiches sont disponibles."
                : "Aucune ligne ne correspond à ce filtre."}
            </p>
          ) : (
            <MyLeadGenerationQueueTable items={filteredTableRows} showCeeColumn={showCeeColumn} />
          )}
        </section>
      )}

      {needsCeePick && !hasValidSelection ? null : (
        <section
          className={cn(
            "space-y-5 rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm sm:p-6",
            "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
          )}
        >
          {scopeTitle ? (
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Produit CEE (filtre carnet)
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground">{scopeTitle}</p>
              </div>
            </div>
          ) : null}

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 dark:bg-emerald-500/[0.08]">
              <p className="text-[11px] font-medium text-muted-foreground">Stock neuf (Nouveau)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {Math.max(0, stockForPlafond)} / {maxCap}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {(() => {
                  const n = Math.max(0, kpis.totalInQueue - kpis.freshStock);
                  if (n === 0) return "Aucune fiche en suivi hors stock neuf.";
                  return `${n} fiche${n > 1 ? "s" : ""} en suivi (Contacté / À rappeler).`;
                })()}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5 dark:bg-emerald-500/[0.08]">
              <p className="text-[11px] font-medium text-muted-foreground">Places restantes</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {placesLeft}
              </p>
            </div>
            <div className="rounded-lg border border-red-500/25 bg-red-500/[0.05] px-3 py-2.5 dark:bg-red-500/[0.07]">
              <p className="text-[11px] font-medium text-muted-foreground">Rappels en retard</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">{kpis.overdue}</p>
            </div>
            <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.05] px-3 py-2.5 dark:bg-orange-500/[0.08]">
              <p className="text-[11px] font-medium text-muted-foreground">À appeler aujourd’hui</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-orange-800 dark:text-orange-200">
                {kpis.dueToday}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
              <p className="text-[11px] font-medium text-muted-foreground">Priorité haute</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{kpis.highPriority}</p>
            </div>
          </div>

          <MyLeadQueueReadyPoolFetchButton
            stockForPlafond={fetchStock}
            ceeSheetOptions={ceeSheetOptions}
            selectedCeeSheetId={selectedCeeSheetId}
            onSelectedCeeSheetIdChange={setSelectedCeeSheetId}
            viewerUserId={viewerUserId}
            ceeSelectionMandatory={needsCeePick}
            effectiveStockCap={effectiveStockCap}
          />
        </section>
      )}
    </div>
  );
}
