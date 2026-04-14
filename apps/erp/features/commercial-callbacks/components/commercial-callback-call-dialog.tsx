"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { abandonCommercialCallbackCall } from "@/features/commercial-callbacks/actions/abandon-commercial-callback-call";
import { completeCallbackOutcome } from "@/features/commercial-callbacks/actions/complete-callback-outcome";
import { convertCommercialCallbackToLead } from "@/features/commercial-callbacks/actions/convert-callback-to-lead";
import { quickRescheduleCommercialCallback } from "@/features/commercial-callbacks/actions/quick-reschedule-commercial-callback";
import { recordCallbackNoAnswer } from "@/features/commercial-callbacks/actions/record-callback-no-answer";
import { startCommercialCallbackCall } from "@/features/commercial-callbacks/actions/start-commercial-callback-call";
import { CallbackAiPanels } from "@/features/commercial-callbacks/components/callback-ai-panels";
import {
  QUICK_RESCHEDULE_LABELS,
  QUICK_RESCHEDULE_PRESETS,
  type QuickReschedulePreset,
} from "@/features/commercial-callbacks/lib/quick-reschedule-paris";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function formatLastCall(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

type CommercialCallbackCallDialogProps = {
  row: CommercialCallbackRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function CommercialCallbackCallDialog({
  row,
  open,
  onOpenChange,
  onDone,
}: CommercialCallbackCallDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const outcomeHandled = useRef(false);

  useEffect(() => {
    if (!open || !row) {
      return;
    }
    outcomeHandled.current = false;
    startTransition(async () => {
      const res = await startCommercialCallbackCall({ id: row.id });
      if (!res.ok) {
        toast.error("Impossible de démarrer l’appel", { description: res.error });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- déclenché à l’ouverture pour row.id
  }, [open, row?.id]);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && row && !outcomeHandled.current) {
      void abandonCommercialCallbackCall({ id: row.id });
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onDone?.();
    }
  }

  function runOutcome(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error("Action impossible", { description: res.error ?? "" });
        return;
      }
      outcomeHandled.current = true;
      onOpenChange(false);
      onDone?.();
    });
  }

  if (!row) {
    return null;
  }

  const tel = row.phone.replace(/\s/g, "");
  const lastCall = formatLastCall(row.last_call_at);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5" />
            Appeler — {row.company_name}
          </DialogTitle>
          <DialogDescription>
            Script et résumé ci-dessous ; puis coordonnées et issue de l’appel.
          </DialogDescription>
        </DialogHeader>

        <CallbackAiPanels row={row} compact onUpdated={() => router.refresh()} />

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="font-medium text-foreground">{row.contact_name}</div>
            <a href={`tel:${tel}`} className="text-base font-semibold text-primary underline">
              {row.phone}
            </a>
            {row.email ? <div className="text-muted-foreground">{row.email}</div> : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Tentatives : {row.attempts_count ?? 0}</span>
            {lastCall ? <span>· Dernier contact : {lastCall}</span> : null}
          </div>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Commentaire</span>
            <p className="mt-1 line-clamp-6 whitespace-pre-wrap">{row.callback_comment}</p>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Après l’appel</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1"
              disabled={pending}
              onClick={() =>
                runOutcome(async () => {
                  const res = await convertCommercialCallbackToLead({ callbackId: row.id });
                  if (res.ok) {
                    toast.success("Lead créé", {
                      description: (
                        <Link href={`/leads/${res.leadId}`} className="underline">
                          Ouvrir le lead
                        </Link>
                      ),
                    });
                    return { ok: true };
                  }
                  return { ok: false, error: res.error };
                })
              }
            >
              Convertir en lead
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                runOutcome(async () => {
                  const res = await completeCallbackOutcome({ id: row.id, status: "completed" });
                  if (res.ok) toast.success("Marqué comme traité.");
                  return res;
                })
              }
            >
              Terminé (sans lead)
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                runOutcome(async () => {
                  const res = await recordCallbackNoAnswer({ id: row.id });
                  if (res.ok) {
                    toast.message("Sans réponse enregistrée", {
                      description:
                        res.status === "cold_followup"
                          ? "Relance froide : priorité réduite."
                          : `Tentative ${res.attempts}/3 avant relance froide.`,
                    });
                    return { ok: true };
                  }
                  return { ok: false, error: res.error };
                })
              }
            >
              Sans réponse
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                runOutcome(async () => {
                  const res = await completeCallbackOutcome({ id: row.id, status: "cancelled" });
                  if (res.ok) toast.success("Rappel annulé.");
                  return res;
                })
              }
            >
              Annuler le suivi
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">Reporter vite</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_RESCHEDULE_PRESETS.map((preset: QuickReschedulePreset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={pending}
                onClick={() =>
                  runOutcome(async () => {
                    const res = await quickRescheduleCommercialCallback({ id: row.id, preset });
                    if (res.ok) toast.success(`Reporté : ${QUICK_RESCHEDULE_LABELS[preset]}`);
                    return res;
                  })
                }
              >
                {QUICK_RESCHEDULE_LABELS[preset]}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => handleDialogOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
