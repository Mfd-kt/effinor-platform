"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button-variants";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { completeCallbackOutcome } from "@/features/commercial-callbacks/actions/complete-callback-outcome";
import { convertCommercialCallbackToLead } from "@/features/commercial-callbacks/actions/convert-callback-to-lead";
import { rescheduleCommercialCallback } from "@/features/commercial-callbacks/actions/reschedule-commercial-callback";
import { isTerminalCallbackStatus } from "@/features/commercial-callbacks/domain/callback-dates";
import {
  CALLBACK_TIME_WINDOW_LABELS,
  CALLBACK_TIME_WINDOWS,
} from "@/features/commercial-callbacks/domain/callback-status";
import { timeForInput } from "@/features/commercial-callbacks/lib/format-callback-time-input";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { cn } from "@/lib/utils";

type CallbackRowActionsProps = {
  row: CommercialCallbackRow;
  onEdit: (row: CommercialCallbackRow) => void;
};

export function CallbackRowActions({ row, onEdit }: CallbackRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [resForm, setResForm] = useState({
    callback_date: row.callback_date,
    callback_time: timeForInput(row.callback_time),
    callback_time_window: row.callback_time_window ?? "",
    note: "",
  });

  const terminal = isTerminalCallbackStatus(row.status);
  const canAct = !terminal;

  function refresh() {
    router.refresh();
  }

  function openReschedule() {
    setResForm({
      callback_date: row.callback_date,
      callback_time: timeForInput(row.callback_time),
      callback_time_window: row.callback_time_window ?? "",
      note: "",
    });
    setRescheduleOpen(true);
  }

  function submitReschedule() {
    startTransition(async () => {
      const res = await rescheduleCommercialCallback({
        id: row.id,
        callback_date: resForm.callback_date,
        callback_time: resForm.callback_time.trim() || undefined,
        callback_time_window:
          resForm.callback_time_window === ""
            ? null
            : (resForm.callback_time_window as (typeof CALLBACK_TIME_WINDOWS)[number]),
        note: resForm.note.trim() || undefined,
      });
      if (!res.ok) {
        toast.error("Report impossible", { description: res.error });
        return;
      }
      toast.success("Rappel reporté.");
      setRescheduleOpen(false);
      refresh();
    });
  }

  function markCompleted() {
    startTransition(async () => {
      const res = await completeCallbackOutcome({ id: row.id, status: "completed" });
      if (!res.ok) {
        toast.error("Mise à jour impossible", { description: res.error });
        return;
      }
      toast.success("Marqué comme effectué.");
      refresh();
    });
  }

  function markCancelled() {
    startTransition(async () => {
      const res = await completeCallbackOutcome({ id: row.id, status: "cancelled" });
      if (!res.ok) {
        toast.error("Annulation impossible", { description: res.error });
        return;
      }
      toast.success("Rappel annulé.");
      refresh();
    });
  }

  function submitConvert() {
    startTransition(async () => {
      const res = await convertCommercialCallbackToLead({ callbackId: row.id });
      if (!res.ok) {
        toast.error("Conversion impossible", { description: res.error });
        return;
      }
      toast.success("Lead créé depuis le rappel.", {
        description: (
          <Link href={`/leads/${res.leadId}`} className="underline">
            Ouvrir le lead
          </Link>
        ),
      });
      setConvertOpen(false);
      refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8")}
          disabled={pending}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {row.status === "converted_to_lead" && row.converted_lead_id ? (
            <DropdownMenuItem render={<Link href={`/leads/${row.converted_lead_id}`} />}>
              Voir le lead
            </DropdownMenuItem>
          ) : null}
          {canAct ? (
            <>
              <DropdownMenuItem onClick={() => onEdit(row)}>
                <Pencil className="size-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={markCompleted}>Marquer effectué</DropdownMenuItem>
              <DropdownMenuItem onClick={openReschedule}>Reporter</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={markCancelled}>
                Annuler
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConvertOpen(true)}>Convertir en lead</DropdownMenuItem>
            </>
          ) : row.status !== "converted_to_lead" ? (
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <Pencil className="size-4" />
              Modifier
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reporter le rappel</DialogTitle>
            <DialogDescription>
              La nouvelle échéance remplace la date actuelle ; un historique est ajouté au commentaire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor={`rs-date-${row.id}`}>Date</Label>
              <Input
                id={`rs-date-${row.id}`}
                type="date"
                value={resForm.callback_date}
                onChange={(e) => setResForm((f) => ({ ...f, callback_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`rs-time-${row.id}`}>Heure</Label>
              <Input
                id={`rs-time-${row.id}`}
                type="time"
                value={resForm.callback_time}
                onChange={(e) => setResForm((f) => ({ ...f, callback_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fenêtre</Label>
              <Select
                value={resForm.callback_time_window || "none"}
                onValueChange={(v) =>
                  setResForm((f) => ({
                    ...f,
                    callback_time_window: v === "none" || v == null ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {CALLBACK_TIME_WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {CALLBACK_TIME_WINDOW_LABELS[w]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`rs-note-${row.id}`}>Note (optionnel)</Label>
              <Textarea
                id={`rs-note-${row.id}`}
                value={resForm.note}
                onChange={(e) => setResForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
              Fermer
            </Button>
            <Button type="button" onClick={submitReschedule} disabled={pending}>
              Reporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir en lead</DialogTitle>
            <DialogDescription>
              Un lead « commercial_callback » sera créé à partir de ce rappel. L’e-mail « premier contact » ne sera pas
              envoyé automatiquement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>
              Retour
            </Button>
            <Button type="button" onClick={submitConvert} disabled={pending}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
