"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createCommercialCallback } from "@/features/commercial-callbacks/actions/create-commercial-callback";
import { updateCommercialCallback } from "@/features/commercial-callbacks/actions/update-commercial-callback";
import { CallbackAutoFollowupControl } from "@/features/commercial-callbacks/components/callback-auto-followup-control";
import { CallbackAiPanels } from "@/features/commercial-callbacks/components/callback-ai-panels";
import {
  CALLBACK_PRIORITIES,
  CALLBACK_PRIORITY_LABELS,
  CALLBACK_TIME_WINDOW_LABELS,
  CALLBACK_TIME_WINDOWS,
  PROSPECT_TEMPERATURE_LABELS,
  PROSPECT_TEMPERATURES,
} from "@/features/commercial-callbacks/domain/callback-status";
import { timeForInput } from "@/features/commercial-callbacks/lib/format-callback-time-input";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

type CommercialCallbackSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = création */
  editing: CommercialCallbackRow | null;
  onSaved?: () => void;
};

function parseEurInput(s: string): number | null | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number.parseFloat(t.replace(",", "."));
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

const emptyForm = {
  company_name: "",
  contact_name: "",
  phone: "",
  email: "",
  callback_date: "",
  callback_time: "",
  callback_time_window: "" as string,
  callback_comment: "",
  priority: "normal" as string,
  source: "",
  call_context_summary: "",
  prospect_temperature: "" as string,
  estimated_value_eur: "",
};

export function CommercialCallbackSheet({
  open,
  onOpenChange,
  editing,
  onSaved,
}: CommercialCallbackSheetProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // Synchroniser le formulaire à l’ouverture (pattern formulaire contrôlé).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset à open/editing
      setForm({
        company_name: editing.company_name,
        contact_name: editing.contact_name,
        phone: editing.phone,
        email: editing.email ?? "",
        callback_date: editing.callback_date,
        callback_time: timeForInput(editing.callback_time),
        callback_time_window: editing.callback_time_window ?? "",
        callback_comment: editing.callback_comment,
        priority: editing.priority || "normal",
        source: editing.source ?? "",
        call_context_summary: editing.call_context_summary ?? "",
        prospect_temperature: editing.prospect_temperature ?? "",
        estimated_value_eur:
          editing.estimated_value_cents != null
            ? String(editing.estimated_value_cents / 100)
            : "",
      });
    } else {
      setForm({
        ...emptyForm,
        callback_date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, editing]);

  function submit() {
    startTransition(async () => {
      if (editing) {
        const res = await updateCommercialCallback({
          id: editing.id,
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          callback_date: form.callback_date,
          callback_time: form.callback_time.trim() || undefined,
          callback_time_window:
            form.callback_time_window === "" ? null : (form.callback_time_window as (typeof CALLBACK_TIME_WINDOWS)[number]),
          callback_comment: form.callback_comment.trim(),
          priority: form.priority as (typeof CALLBACK_PRIORITIES)[number],
          source: form.source.trim() || null,
          call_context_summary: form.call_context_summary.trim() || null,
          prospect_temperature:
            form.prospect_temperature === ""
              ? null
              : (form.prospect_temperature as (typeof PROSPECT_TEMPERATURES)[number]),
          estimated_value_eur: parseEurInput(form.estimated_value_eur) ?? null,
        });
        if (!res.ok) {
          toast.error("Modification impossible", { description: res.error });
          return;
        }
        toast.success("Rappel mis à jour.");
      } else {
        const res = await createCommercialCallback({
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          callback_date: form.callback_date,
          callback_time: form.callback_time.trim() || undefined,
          callback_time_window:
            form.callback_time_window === "" ? null : (form.callback_time_window as (typeof CALLBACK_TIME_WINDOWS)[number]),
          callback_comment: form.callback_comment.trim(),
          priority: form.priority as (typeof CALLBACK_PRIORITIES)[number],
          source: form.source.trim() || null,
          call_context_summary: form.call_context_summary.trim() || null,
          prospect_temperature:
            form.prospect_temperature === ""
              ? null
              : (form.prospect_temperature as (typeof PROSPECT_TEMPERATURES)[number]),
          estimated_value_eur: parseEurInput(form.estimated_value_eur),
        });
        if (!res.ok) {
          toast.error("Création impossible", { description: res.error });
          return;
        }
        toast.success("Rappel créé.");
      }
      onOpenChange(false);
      onSaved?.();
    });
  }

  const title = editing ? "Modifier le rappel" : "Nouveau rappel";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Rappel téléprospection — indépendant du simulateur CEE.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="cb-company">Société</Label>
            <Input
              id="cb-company"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-contact">Contact</Label>
            <Input
              id="cb-contact"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cb-phone">Téléphone</Label>
              <Input
                id="cb-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-email">E-mail</Label>
              <Input
                id="cb-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cb-date">Date de rappel</Label>
              <Input
                id="cb-date"
                type="date"
                value={form.callback_date}
                onChange={(e) => setForm((f) => ({ ...f, callback_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-time">Heure (optionnel)</Label>
              <Input
                id="cb-time"
                type="time"
                value={form.callback_time}
                onChange={(e) => setForm((f) => ({ ...f, callback_time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fenêtre</Label>
            <Select
              value={form.callback_time_window || "none"}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  callback_time_window: v === "none" || v == null ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sans préférence" />
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
            <Label>Priorité</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, priority: v == null ? "normal" : v }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALLBACK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {CALLBACK_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-source">Source (optionnel)</Label>
            <Input
              id="cb-source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-context">Contexte / accroche (optionnel)</Label>
            <Textarea
              id="cb-context"
              className="min-h-[72px] text-sm"
              placeholder="Ex. : le prospect veut un chiffrage avant le 15…"
              value={form.call_context_summary}
              onChange={(e) => setForm((f) => ({ ...f, call_context_summary: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Température prospect</Label>
              <Select
                value={form.prospect_temperature || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    prospect_temperature: v === "none" || v == null ? "" : v,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {PROSPECT_TEMPERATURES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PROSPECT_TEMPERATURE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-est">Montant potentiel (€ HT, optionnel)</Label>
              <Input
                id="cb-est"
                inputMode="decimal"
                placeholder="0"
                value={form.estimated_value_eur}
                onChange={(e) => setForm((f) => ({ ...f, estimated_value_eur: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-comment">Commentaire</Label>
            <Textarea
              id="cb-comment"
              className="min-h-[120px]"
              value={form.callback_comment}
              onChange={(e) => setForm((f) => ({ ...f, callback_comment: e.target.value }))}
            />
          </div>

          {editing ? (
            <div className="space-y-4 border-t pt-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Aide à l’appel (IA)</p>
                <CallbackAiPanels row={editing} onUpdated={() => router.refresh()} />
              </div>
              <CallbackAutoFollowupControl row={editing} />
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {editing ? "Enregistrer" : "Créer"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
