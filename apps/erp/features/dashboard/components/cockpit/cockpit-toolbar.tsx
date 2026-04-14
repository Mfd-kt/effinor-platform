"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CockpitFilterOptions } from "@/features/dashboard/domain/cockpit";
import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";

type Props = {
  filters: CockpitScopeFilters;
  options: CockpitFilterOptions;
};

export function CockpitScopeToolbar({ filters, options }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const push = useCallback(
    (next: Partial<CockpitScopeFilters>) => {
      const p = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...next };
      if (merged.ceeSheetId) p.set("ceeSheetId", merged.ceeSheetId);
      else p.delete("ceeSheetId");
      if (merged.teamId) p.set("teamId", merged.teamId);
      else p.delete("teamId");
      if (merged.leadChannel) p.set("channel", merged.leadChannel);
      else p.delete("channel");
      p.set("period", merged.period);
      startTransition(() => {
        router.push(`?${p.toString()}`, { scroll: false });
      });
    },
    [filters, router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Période</Label>
        <Select
          value={filters.period}
          onValueChange={(v) =>
            push({ period: v as CockpitScopeFilters["period"] })
          }
          disabled={pending}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd’hui</SelectItem>
            <SelectItem value="week">Semaine en cours</SelectItem>
            <SelectItem value="month">Mois en cours</SelectItem>
            <SelectItem value="days30">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {options.sheets.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Fiche CEE
          </Label>
          <Select
            value={filters.ceeSheetId ?? "__all__"}
            onValueChange={(v) => push({ ceeSheetId: v === "__all__" ? null : v })}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes les fiches</SelectItem>
              {options.sheets.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {options.teams.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Équipe</Label>
          <Select
            value={filters.teamId ?? "__all__"}
            onValueChange={(v) => push({ teamId: v === "__all__" ? null : v })}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes les équipes</SelectItem>
              {options.teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {options.channels.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Canal (lead)
          </Label>
          <Select
            value={filters.leadChannel ?? "__all__"}
            onValueChange={(v) => push({ leadChannel: v === "__all__" ? null : v })}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les canaux</SelectItem>
              {options.channels.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        disabled={pending}
        onClick={() => router.refresh()}
      >
        Actualiser
      </Button>
    </div>
  );
}
