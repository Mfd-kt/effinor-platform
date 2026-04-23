"use client";

import { useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { LeadGenerationMyQueueCeeSheetOption } from "../lib/my-queue-cee-sheet-option";
import { trackLeadGenerationUiEventAction } from "../actions/track-lead-generation-ui-event-action";
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
import type {
  AgentCommercialCapacityLevel,
  AgentCommercialCapacityViewModel,
} from "../lib/agent-commercial-capacity";
import { COMMERCIAL_CAPACITY_BLOCK_THRESHOLD } from "../lib/agent-commercial-capacity";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";
import {
  MyLeadQueueCeeSheetPicker,
  MyLeadQueueReadyPoolFetchButton,
} from "./my-lead-generation-queue-reload-button";
import { MyLeadGenerationQueueTable } from "./my-lead-generation-queue-table";

const CAPACITY_STATE_BADGE_LABEL: Record<AgentCommercialCapacityLevel, string> = {
  normal: "Capacité normale",
  warning: "Volume élevé",
  blocked: "Capacité atteinte",
};

const DATA_UNAVAILABLE_HINT = "Données temporairement indisponibles";

function capacityStateBadgeClass(level: AgentCommercialCapacityLevel): string {
  if (level === "blocked") {
    return "border-rose-500/40 bg-rose-500/[0.12] text-rose-950 dark:border-rose-500/35 dark:bg-rose-500/[0.15] dark:text-rose-50";
  }
  if (level === "warning") {
    return "border-amber-500/40 bg-amber-500/[0.12] text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/[0.12] dark:text-amber-50";
  }
  return "border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/[0.12] dark:text-emerald-50";
}

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
  /** Capacité agent — uniquement {@link computeAgentCommercialCapacity} (pas de valeurs factices si échec). */
  commercialCapacity: AgentCommercialCapacityViewModel;
};

export function MyLeadGenerationQueueAgentShell({
  items,
  ceeSheetOptions,
  viewerUserId,
  effectiveStockCap,
  commercialCapacity,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedStaleRef = useRef(false);
  const [, startTrackingTransition] = useTransition();

  const searchFilter = searchParams.get("qf");
  const staleReturn = searchParams.get("stale") === "1";
  const initialFilter: MyQueueQuickFilter = FILTERS.some((f) => f.id === searchFilter)
    ? (searchFilter as MyQueueQuickFilter)
    : "all";

  const [filter, setFilter] = useState<MyQueueQuickFilter>(initialFilter);
  const [selectedCeeSheetId, setSelectedCeeSheetId] = useState("");

  const needsCeePick = ceeSheetOptions.length > 0;
  const optionIdsKey = useMemo(
    () => [...ceeSheetOptions.map((o) => o.id)].sort().join("\0"),
    [ceeSheetOptions],
  );

  useLayoutEffect(() => {
    const qf = searchParams.get("qf");
    if (!qf) {
      if (filter !== "all") {
        setFilter("all");
      }
      return;
    }
    if (FILTERS.some((f) => f.id === qf) && qf !== filter) {
      setFilter(qf as MyQueueQuickFilter);
    }
  }, [searchParams, filter]);

  useLayoutEffect(() => {
    if (!staleReturn) {
      trackedStaleRef.current = false;
      return;
    }
    if (!trackedStaleRef.current) {
      trackedStaleRef.current = true;
      startTrackingTransition(() => {
        void trackLeadGenerationUiEventAction({
          eventType: "my_queue_stale_return_shown",
          context: {
            path: pathname,
            qf: searchParams.get("qf"),
            cee: searchParams.get("cee"),
          },
        });
      });
    }
    const p = new URLSearchParams(searchParams.toString());
    p.delete("stale");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [staleReturn, searchParams, pathname, router, startTrackingTransition]);

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
    const ceeFromUrl = searchParams.get("cee")?.trim() || "";
    if (!ceeFromUrl) {
      return;
    }
    if (
      ceeFromUrl === MY_QUEUE_NO_CEE_SHEET_SENTINEL ||
      ceeSheetOptions.some((o) => o.id === ceeFromUrl)
    ) {
      setSelectedCeeSheetId(ceeFromUrl);
    }
  }, [searchParams, optionIdsKey, ceeSheetOptions]);

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

  useLayoutEffect(() => {
    const current = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      current.delete("qf");
    } else {
      current.set("qf", filter);
    }
    if (!selectedCeeSheetId.trim()) {
      current.delete("cee");
    } else {
      current.set("cee", selectedCeeSheetId.trim());
    }
    const next = current.toString();
    const href = next ? `${pathname}?${next}` : pathname;
    const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (href !== currentHref) {
      router.replace(href, { scroll: false });
    }
  }, [filter, selectedCeeSheetId, pathname, router, searchParams]);

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

  useLayoutEffect(() => {
    const focusStockId = searchParams.get("focus")?.trim();
    if (!focusStockId) {
      return;
    }
    const id = `queue-row-${focusStockId}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      const p = new URLSearchParams(searchParams.toString());
      p.delete("focus");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, itemsInCeeScope.length]);

  const freshInScope = computeQueueKpis(itemsInCeeScope).freshStock;

  const stockForPlafond = isNoCeeSelected ? globalFreshStock : freshInScope;

  const kpiItems = itemsInCeeScope;
  const kpis = useMemo(() => computeQueueKpis(kpiItems), [kpiItems]);

  const capOk = commercialCapacity.ok;
  const cap = capOk ? commercialCapacity.snapshot : null;

  const maxCap = effectiveStockCap;
  const placesRestantesCap120 =
    cap != null ? Math.max(0, COMMERCIAL_CAPACITY_BLOCK_THRESHOLD - cap.total) : null;

  const filteredTableRows = useMemo(() => {
    const filtered = itemsInCeeScope.filter((i) => itemMatchesQuickFilter(i, filter));
    return sortQueueItems(filtered);
  }, [itemsInCeeScope, filter]);

  const returnToHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      p.delete("qf");
    } else {
      p.set("qf", filter);
    }
    if (!selectedCeeSheetId.trim()) {
      p.delete("cee");
    } else {
      p.set("cee", selectedCeeSheetId.trim());
    }
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [searchParams, filter, selectedCeeSheetId, pathname]);

  const showCeeColumn = !needsCeePick;

  const scopeTitle = useMemo(() => {
    if (!needsCeePick) return null;
    if (!hasValidSelection) return null;
    if (isNoCeeSelected) return "Sans périmètre";
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
        {staleReturn ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2.5 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/[0.12] dark:text-amber-100">
            Cette fiche n’est plus disponible dans votre file (mise à jour en cours ou attribution terminée). La liste a
            été rechargée.
          </p>
        ) : null}
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Votre file</span> — liste des contacts qui vous sont attribués.
          Le filtre ci-dessous limite l’affichage par périmètre. Seul le statut pipeline{" "}
          <span className="font-medium text-foreground">Nouveau</span> compte pour votre stock disponible au sens plafond /
          réinjection ; le reste est du suivi.
        </p>
        {needsCeePick && !hasValidSelection ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/[0.09] dark:text-amber-100">
            Choisissez un <span className="font-semibold">périmètre</span> (ou « sans périmètre ») pour afficher votre
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
            itemsInCeeScope.length === 0 ? (
              <EmptyState
                className="py-10"
                title="Aucune fiche à traiter"
                description={
                  isNoCeeSelected
                    ? "Aucun contact dans ce périmètre. Récupérez des fiches disponibles via le panneau plus bas si le plafond le permet."
                    : "Aucun contact sur ce produit. Utilisez le bouton de récupération dans la section du bas s’il reste des fiches côté stock."
                }
                icon={<ClipboardList className="size-10" aria-hidden />}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune ligne ne correspond à ce filtre.
              </p>
            )
          ) : (
            <MyLeadGenerationQueueTable
              items={filteredTableRows}
              showCeeColumn={showCeeColumn}
              returnToHref={returnToHref}
            />
          )}
        </section>
      )}

      {needsCeePick && !hasValidSelection ? null : (
        <section
          className={cn(
            "space-y-6 rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm sm:p-6",
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Capacité & priorités</h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                cap != null ? capacityStateBadgeClass(cap.level) : "border-border/80 bg-muted/30 text-muted-foreground",
              )}
            >
              {cap != null ? CAPACITY_STATE_BADGE_LABEL[cap.level] : "Indisponible"}
            </Badge>
          </div>
          {!capOk ? (
            <p className="text-[11px] text-muted-foreground">{DATA_UNAVAILABLE_HINT}</p>
          ) : null}

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Capacité agent</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Nouveaux</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {cap != null ? cap.stockNeuf : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">En suivi</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {cap != null ? cap.suivi : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Total actif</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {cap != null ? (
                    <>
                      {cap.total} / {COMMERCIAL_CAPACITY_BLOCK_THRESHOLD}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Places restantes</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {placesRestantesCap120 ?? "—"}
                </p>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Objectif de nouveaux simultanés (dispatch)&nbsp;:</span> {maxCap}
              . Les quatre chiffres ci-dessus couvrent l’ensemble de vos assignations actives (hors converties, hors cible et
              archivées), alignés sur le plafond {COMMERCIAL_CAPACITY_BLOCK_THRESHOLD}.
            </p>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priorités du jour</p>
            <p className="text-[10px] text-muted-foreground">
              Uniquement les fiches du périmètre capacité, vue filtrée par le carnet affiché ci-dessus.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-red-500/25 bg-red-500/[0.05] px-3 py-2.5 dark:bg-red-500/[0.07]">
                <p className="text-[11px] font-medium text-muted-foreground">Rappels en retard</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {cap != null ? kpis.overdue : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.05] px-3 py-2.5 dark:bg-orange-500/[0.08]">
                <p className="text-[11px] font-medium text-muted-foreground">À appeler aujourd’hui</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-orange-800 dark:text-orange-200">
                  {cap != null ? kpis.dueToday : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Priorité haute</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {cap != null ? kpis.highPriority : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Récupérer des fiches
            </p>
            <MyLeadQueueReadyPoolFetchButton
              stockForPlafond={fetchStock}
              ceeSheetOptions={ceeSheetOptions}
              selectedCeeSheetId={selectedCeeSheetId}
              onSelectedCeeSheetIdChange={setSelectedCeeSheetId}
              viewerUserId={viewerUserId}
              ceeSelectionMandatory={needsCeePick}
              effectiveStockCap={effectiveStockCap}
              commercialCapacityBlocked={cap != null && cap.level === "blocked"}
              commercialCapacityLevel={cap != null ? cap.level : "normal"}
            />
          </div>
        </section>
      )}
    </div>
  );
}
