"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Phone, UserX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CallbackRowActions } from "@/features/commercial-callbacks/components/callback-row-actions";
import { markCommercialCallbackLost } from "@/features/commercial-callbacks/actions/mark-commercial-callback-lost";
import { quickRescheduleCommercialCallback } from "@/features/commercial-callbacks/actions/quick-reschedule-commercial-callback";
import { getCallbackVisualTier } from "@/features/commercial-callbacks/domain/callback-buckets";
import { isTerminalCallbackStatus } from "@/features/commercial-callbacks/domain/callback-dates";
import { computeCallbackPriorityScore } from "@/features/commercial-callbacks/domain/priority-score";
import {
  CALLBACK_PRIORITY_LABELS,
  PROSPECT_TEMPERATURE_LABELS,
} from "@/features/commercial-callbacks/domain/callback-status";
import { formatCallbackTimeDisplay } from "@/features/commercial-callbacks/lib/format-callback-display";
import {
  QUICK_RESCHEDULE_LABELS,
  QUICK_RESCHEDULE_PRESETS,
  type QuickReschedulePreset,
} from "@/features/commercial-callbacks/lib/quick-reschedule-paris";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function tierLabel(tier: ReturnType<typeof getCallbackVisualTier>): string {
  switch (tier) {
    case "critical":
      return "Critique";
    case "important":
      return "Aujourd’hui";
    default:
      return "Normal";
  }
}

function tierBadgeVariant(tier: ReturnType<typeof getCallbackVisualTier>): "destructive" | "default" | "secondary" {
  switch (tier) {
    case "critical":
      return "destructive";
    case "important":
      return "default";
    default:
      return "secondary";
  }
}

export function CommercialCallbackAgentRow({
  row,
  onEdit,
  onOpenCall,
  onOpenConvertSimulator,
  canRunSimulator,
  assignedAgentLabel = null,
}: {
  row: CommercialCallbackRow;
  onEdit: (row: CommercialCallbackRow) => void;
  onOpenCall: (row: CommercialCallbackRow) => void;
  onOpenConvertSimulator: () => void;
  /** Fiches CEE disponibles pour ouvrir le simulateur de conversion. */
  canRunSimulator: boolean;
  /** Libellé agent assigné (vue direction). */
  assignedAgentLabel?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lostOpen, setLostOpen] = useState(false);

  const tier = getCallbackVisualTier(row);
  const borderClass =
    tier === "critical"
      ? "border-l-4 border-l-red-500"
      : tier === "important"
        ? "border-l-4 border-l-orange-500"
        : "border-l-4 border-l-emerald-600/70";

  const score = computeCallbackPriorityScore(row);
  const terminal = isTerminalCallbackStatus(row.status);

  function refresh() {
    router.refresh();
  }

  function quickPreset(preset: QuickReschedulePreset) {
    startTransition(async () => {
      const res = await quickRescheduleCommercialCallback({ id: row.id, preset });
      if (!res.ok) {
        toast.error("Report impossible", { description: res.error });
        return;
      }
      toast.success(`Reporté : ${QUICK_RESCHEDULE_LABELS[preset]}`);
      refresh();
    });
  }

  function convert() {
    if (!canRunSimulator) {
      toast.error("Conversion impossible", {
        description: "Aucune fiche CEE n’est disponible pour lancer le simulateur.",
      });
      return;
    }
    onOpenConvertSimulator();
  }

  const tempLabel =
    row.prospect_temperature && row.prospect_temperature in PROSPECT_TEMPERATURE_LABELS
      ? PROSPECT_TEMPERATURE_LABELS[row.prospect_temperature as keyof typeof PROSPECT_TEMPERATURE_LABELS]
      : null;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${borderClass}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-foreground">{row.company_name}</span>
          <Badge variant={tierBadgeVariant(tier)} className="shrink-0 text-[10px] uppercase">
            {tierLabel(tier)}
          </Badge>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            Score {score}
          </Badge>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {CALLBACK_PRIORITY_LABELS[row.priority as keyof typeof CALLBACK_PRIORITY_LABELS] ?? row.priority}
          </Badge>
          {tempLabel ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {tempLabel}
            </Badge>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {row.contact_name} · {row.phone}
        </div>
        {assignedAgentLabel ? (
          <div className="text-xs font-medium text-primary/90">Agent : {assignedAgentLabel}</div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {new Date(row.callback_date).toLocaleDateString("fr-FR")} · {formatCallbackTimeDisplay(row.callback_time)}
          {(row.attempts_count ?? 0) > 0 ? ` · ${row.attempts_count} tentative(s)` : null}
        </div>
        {row.call_context_summary ? (
          <p className="line-clamp-2 text-xs text-foreground/90">{row.call_context_summary}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:max-w-[min(100%,28rem)] sm:justify-end">
        {!terminal ? (
          <>
            <Button type="button" size="sm" className="gap-1" onClick={() => onOpenCall(row)}>
              <Phone className="size-3.5" />
              Appeler
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-xs hover:bg-accent disabled:opacity-50"
                disabled={pending}
              >
                Reporter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {QUICK_RESCHEDULE_PRESETS.map((preset) => (
                  <DropdownMenuItem key={preset} onClick={() => quickPreset(preset)}>
                    {QUICK_RESCHEDULE_LABELS[preset]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={convert}>
              Convertir
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              disabled={pending}
              onClick={() => setLostOpen(true)}
            >
              <UserX className="size-3.5" />
              Perdu
            </Button>
          </>
        ) : null}
        <CallbackRowActions
          row={row}
          onEdit={onEdit}
          onOpenConvertSimulator={canRunSimulator ? onOpenConvertSimulator : undefined}
        />
      </div>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer ce rappel comme perdu ?</DialogTitle>
            <DialogDescription>
              <strong>{row.company_name}</strong> disparaîtra des listes actives et sera rangé sous l’onglet
              « Perdu ».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setLostOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const res = await markCommercialCallbackLost({ callbackId: row.id });
                  if (!res.ok) {
                    toast.error("Action impossible", { description: res.error });
                    return;
                  }
                  toast.success("Rappel marqué comme perdu.");
                  setLostOpen(false);
                  refresh();
                });
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
