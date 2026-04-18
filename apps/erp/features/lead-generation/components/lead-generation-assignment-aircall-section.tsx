"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
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
import { updateLeadGenerationAssignmentCallTraceAction } from "@/features/lead-generation/actions/update-lead-generation-assignment-call-trace-action";
import { leadPhoneToTelHref } from "@/features/leads/lib/lead-phone-tel";
import { isoToDatetimeLocal } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";

const CALL_STATUS_PRESETS = [
  { value: "__empty__", label: "— Non renseigné —" },
  { value: "Ciblé", label: "Ciblé" },
  { value: "Hors cible", label: "Hors cible" },
  { value: "Refus", label: "Refus" },
  { value: "Annulé", label: "Annulé" },
  { value: "À rappeler", label: "À rappeler" },
  { value: "Autre", label: "Autre" },
  { value: "Contact établi", label: "Contact établi" },
  { value: "Répondeur", label: "Répondeur" },
  { value: "Pas de réponse", label: "Pas de réponse" },
  { value: "RDV fixé", label: "RDV fixé" },
  { value: "Numéro invalide", label: "Numéro invalide" },
] as const;

export type LeadGenerationAssignmentAircallSectionProps = {
  assignmentId: string;
  phone: string | null;
  readOnly: boolean;
  initial: {
    last_call_status: string | null;
    last_call_at: string | null;
    last_call_note: string | null;
    last_call_recording_url: string | null;
  };
};

export function LeadGenerationAssignmentAircallSection({
  assignmentId,
  phone,
  readOnly,
  initial,
}: LeadGenerationAssignmentAircallSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const telHref = leadPhoneToTelHref(phone);
  const presetValues = new Set<string>(
    CALL_STATUS_PRESETS.map((p) => p.value).filter((v) => v !== "__empty__"),
  );
  const initialStatusInPreset =
    initial.last_call_status && presetValues.has(initial.last_call_status)
      ? initial.last_call_status
      : "__empty__";

  const [status, setStatus] = useState<string>(initialStatusInPreset);
  const [customStatus, setCustomStatus] = useState(
    initial.last_call_status && !presetValues.has(initial.last_call_status) ? initial.last_call_status : "",
  );
  const [callAt, setCallAt] = useState(isoToDatetimeLocal(initial.last_call_at));
  const [note, setNote] = useState(initial.last_call_note ?? "");
  const [recordingUrl, setRecordingUrl] = useState(initial.last_call_recording_url ?? "");

  function resolvedStatus(): string | null {
    if (status === "__empty__") {
      return customStatus.trim() || null;
    }
    return status;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setMessage(null);
    startTransition(async () => {
      const res = await updateLeadGenerationAssignmentCallTraceAction({
        assignmentId,
        last_call_status: resolvedStatus() ?? undefined,
        last_call_at: callAt.trim() || undefined,
        last_call_note: note || undefined,
        last_call_recording_url: recordingUrl || undefined,
      });
      if (!res.ok) {
        setMessage({ type: "err", text: res.message });
        return;
      }
      if ("removedFromQueue" in res && res.removedFromQueue) {
        setMessage({ type: "ok", text: "Fiche retirée de votre file — redirection…" });
        router.push("/lead-generation/my-queue");
        return;
      }
      setMessage({ type: "ok", text: "Suivi enregistré." });
      router.refresh();
    });
  }

  return (
    <div className="max-w-4xl space-y-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Appel</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lance l’appel sur votre poste (Aircall ou téléphone par défaut). Aucune connexion automatique à Aircall.
          </p>
        </div>
        {telHref ? (
          <Link
            href={telHref}
            className={cn(buttonVariants({ variant: "default", size: "default" }), "w-full shrink-0 sm:w-auto")}
          >
            <Phone className="size-4" aria-hidden />
            Appeler avec Aircall
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">Ajoutez un numéro sur la fiche pour activer l’appel.</p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        <h4 className="text-sm font-semibold text-foreground">Suivi d’appel</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Saisie manuelle après l’appel (pas de synchronisation avec Aircall).{" "}
          <span className="text-foreground/90">
            « Hors cible », « Refus » ou « Annulé » (et les mêmes libellés en statut libre) retirent la fiche de votre
            file et libèrent une place. « Ciblé », « À rappeler » et « Autre » la gardent dans la file.
          </span>
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lg-gen-call-status">Dernier statut d’appel</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v ?? "__empty__");
                if (v && v !== "__empty__") setCustomStatus("");
              }}
              disabled={readOnly}
            >
              <SelectTrigger id="lg-gen-call-status" className="w-full max-w-md">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {CALL_STATUS_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status === "__empty__" ? (
              <Input
                id="lg-gen-call-status-custom"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Ou précisez un statut libre…"
                maxLength={120}
                disabled={readOnly}
                className="max-w-md"
              />
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lg-gen-call-at">Date du dernier appel</Label>
            <Input
              id="lg-gen-call-at"
              type="datetime-local"
              value={callAt}
              onChange={(e) => setCallAt(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lg-gen-call-note">Note d’appel</Label>
            <Textarea
              id="lg-gen-call-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={readOnly}
              placeholder="Compte rendu court…"
              className="resize-y"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lg-gen-call-rec">Lien d’enregistrement (optionnel)</Label>
            <Input
              id="lg-gen-call-rec"
              type="url"
              inputMode="url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              disabled={readOnly}
              placeholder="https://…"
            />
          </div>

          {recordingUrl.trim() && /^https?:\/\//i.test(recordingUrl.trim()) ? (
            <div className="sm:col-span-2 text-xs">
              <a
                href={recordingUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
              >
                Ouvrir le lien d’enregistrement
              </a>
            </div>
          ) : null}

          {message ? (
            <p
              className={cn(
                "sm:col-span-2 text-sm",
                message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
              )}
            >
              {message.text}
            </p>
          ) : null}

          {!readOnly ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer le suivi"}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
