"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { logLeadGenerationAssignmentActivityAction } from "@/features/lead-generation/actions/log-lead-generation-assignment-activity-action";
import { updateLeadGenerationAssignmentCallTraceAction } from "@/features/lead-generation/actions/update-lead-generation-assignment-call-trace-action";
import {
  LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS,
  LEAD_GENERATION_ACTIVITY_TYPE_LABELS,
  type LeadGenerationActivityOutcome,
  type LeadGenerationActivityType,
} from "@/features/lead-generation/domain/assignment-activity";
import {
  AGENT_CALL_PRESET_VALUES,
  AGENT_CALL_STATUS_PRESETS,
  agentCallStatusTriggerLabel,
  resolveAgentCallStatus,
} from "@/features/lead-generation/lib/agent-call-status-presets";
import { mapResolvedCallStatusToActivityOutcome } from "@/features/lead-generation/lib/map-call-status-to-activity-outcome";
import type { LeadGenerationAssignmentActivityListItem } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { resolveNextMyQueueStockIdAction } from "@/features/lead-generation/actions/resolve-next-my-queue-stock-id-action";
import { formatDateTimeFr } from "@/lib/format";
import { isoToDatetimeLocal } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";

type Props = {
  assignmentId: string;
  stockId: string;
  /** Fiche suivante dans la file (même ordre que « Suivant »). Si absent après clôture, retour à la liste. */
  nextStockId?: string | null;
  /** URL de retour liste (filtres + ancre) conservée. */
  returnToHref?: string | null;
  readOnly: boolean;
  initial: {
    last_call_status: string | null;
    last_call_at: string | null;
    last_call_note: string | null;
    last_call_recording_url: string | null;
  };
  initialActivities: LeadGenerationAssignmentActivityListItem[];
};

function buildActivityLabel(resolvedStatus: string | null, note: string): string {
  if (resolvedStatus) {
    return resolvedStatus;
  }
  const t = note.trim();
  if (t) {
    return t.length > 300 ? t.slice(0, 297) + "…" : t;
  }
  return "Appel enregistré";
}

function hrefAfterRemovedFromQueue(nextStockId: string | null | undefined, returnToHref?: string | null): string {
  if (nextStockId) {
    const p = new URLSearchParams();
    if (returnToHref?.trim()) {
      p.set("from", returnToHref.trim());
    }
    p.set("focus", nextStockId);
    return `/lead-generation/my-queue/${nextStockId}?${p.toString()}`;
  }
  return returnToHref?.trim() || "/lead-generation/my-queue";
}

export function LeadGenerationUnifiedAgentActivitySection({
  assignmentId,
  stockId,
  nextStockId = null,
  returnToHref = null,
  readOnly,
  initial,
  initialActivities,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const initialStatusInPreset =
    initial.last_call_status && AGENT_CALL_PRESET_VALUES.has(initial.last_call_status)
      ? initial.last_call_status
      : "__empty__";

  const [status, setStatus] = useState<string>(initialStatusInPreset);
  const [customStatus, setCustomStatus] = useState(
    initial.last_call_status && !AGENT_CALL_PRESET_VALUES.has(initial.last_call_status)
      ? initial.last_call_status
      : "",
  );
  const [callAt, setCallAt] = useState(isoToDatetimeLocal(initial.last_call_at));
  const [note, setNote] = useState(initial.last_call_note ?? "");
  const [recordingUrl, setRecordingUrl] = useState(initial.last_call_recording_url ?? "");
  const [nextActionLocal, setNextActionLocal] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setMessage(null);

    const resolved = resolveAgentCallStatus(status, customStatus);
    const hasNote = note.trim().length > 0;
    const hasDate = callAt.trim().length > 0;
    const hasRelance = nextActionLocal.trim().length > 0;
    const hasUrl = recordingUrl.trim().length > 0;
    if (!resolved && !hasNote && !hasDate && !hasRelance && !hasUrl) {
      setMessage({
        type: "err",
        text: "Indiquez au moins un élément : statut, note, date d’appel, prochaine relance ou lien d’enregistrement.",
      });
      return;
    }

    let nextActionAtIso: string | null = null;
    if (nextActionLocal.trim()) {
      const d = new Date(nextActionLocal);
      if (Number.isNaN(d.getTime())) {
        setMessage({ type: "err", text: "Date de relance invalide." });
        return;
      }
      nextActionAtIso = d.toISOString();
    }

    const activityLabel = buildActivityLabel(resolved, note);
    const activityOutcome = mapResolvedCallStatusToActivityOutcome(resolved);

    const traceUnchanged =
      (resolved ?? "") === (initial.last_call_status ?? "") &&
      note.trim() === (initial.last_call_note ?? "").trim() &&
      callAt === isoToDatetimeLocal(initial.last_call_at) &&
      recordingUrl.trim() === (initial.last_call_recording_url ?? "").trim();

    startTransition(async () => {
      if (!traceUnchanged) {
        const traceRes = await updateLeadGenerationAssignmentCallTraceAction({
          assignmentId,
          last_call_status: resolved ?? undefined,
          last_call_at: callAt.trim() || undefined,
          last_call_note: note.trim() || undefined,
          last_call_recording_url: recordingUrl.trim() || undefined,
        });
        if (!traceRes.ok) {
          setMessage({ type: "err", text: traceRes.message });
          return;
        }
        if (traceRes.removedFromQueue) {
          const resolvedNext = await resolveNextMyQueueStockIdAction({ currentStockId: stockId });
          const freshNextStockId = resolvedNext.ok ? resolvedNext.nextStockId : nextStockId;
          const logRes = await logLeadGenerationAssignmentActivityAction({
            assignmentId,
            activityType: "call",
            activityLabel,
            activityNotes: note.trim() || null,
            outcome: activityOutcome,
            nextActionAt: nextActionAtIso,
            mergeLatestCallStub: true,
          });
          if (!logRes.ok) {
            setMessage({
              type: "err",
              text:
                logRes.error ??
                "La fiche a été retirée de la file, mais le journal n’a pas pu être complété.",
            });
            router.push(hrefAfterRemovedFromQueue(freshNextStockId, returnToHref));
            return;
          }
          setMessage({
            type: "ok",
            text: freshNextStockId
              ? "Fiche retirée de votre file — passage à la suivante…"
              : "Fiche retirée de votre file — retour à la liste…",
          });
          router.push(hrefAfterRemovedFromQueue(freshNextStockId, returnToHref));
          return;
        }
      }

      const logRes = await logLeadGenerationAssignmentActivityAction({
        assignmentId,
        activityType: "call",
        activityLabel,
        activityNotes: note.trim() || null,
        outcome: activityOutcome,
        nextActionAt: nextActionAtIso,
        mergeLatestCallStub: true,
      });
      if (!logRes.ok) {
        setMessage({ type: "err", text: logRes.error ?? "Impossible d’enregistrer le journal." });
        return;
      }

      setNextActionLocal("");
      setMessage({ type: "ok", text: "Suivi enregistré." });
      router.refresh();
    });
  }

  return (
    <Card id="suivi-activite" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">Enregistrer le suivi</CardTitle>
        <p className="text-xs text-muted-foreground">
          Après l’appel, renseignez le statut, le compte rendu et la prochaine relance si besoin. Les statuts « Hors
          cible », « Refus », « Annulé », « Répondeur », « Pas de réponse » ou « Mauvais numéro » (y compris en libellé
          libre proche) retirent la fiche de votre file.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {readOnly ? (
          <p className="rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-3 text-sm text-muted-foreground">
            Saisie désactivée : cette attribution n’est pas celle du compte avec lequel vous naviguez (vue support).
          </p>
        ) : (
          <form className="space-y-4 rounded-md border border-border bg-muted/10 p-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lg-unified-call-status">Statut d’appel</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v ?? "__empty__");
                    if (v && v !== "__empty__") setCustomStatus("");
                  }}
                >
                  <SelectTrigger id="lg-unified-call-status" className="w-full">
                    <SelectValue placeholder="Choisir…">
                      {agentCallStatusTriggerLabel(status, customStatus)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_CALL_STATUS_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {status === "__empty__" ? (
                  <Input
                    id="lg-unified-call-status-custom"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="Ou précisez un libellé libre…"
                    maxLength={120}
                    className="max-w-md"
                  />
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lg-unified-call-at">Date et heure de l’appel</Label>
                <Input
                  id="lg-unified-call-at"
                  type="datetime-local"
                  value={callAt}
                  onChange={(e) => setCallAt(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lg-unified-next">Prochaine relance (optionnel)</Label>
                <Input
                  id="lg-unified-next"
                  type="datetime-local"
                  value={nextActionLocal}
                  onChange={(e) => setNextActionLocal(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lg-unified-note">Compte rendu</Label>
                <Textarea
                  id="lg-unified-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Résumé de l’échange, objections, prochaine étape…"
                  className="resize-y"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lg-unified-rec">Lien d’enregistrement (optionnel)</Label>
                <Input
                  id="lg-unified-rec"
                  type="url"
                  inputMode="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
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
            </div>

            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer le suivi"}
            </Button>
          </form>
        )}

        {message ? (
          <p
            className={cn(
              "text-xs",
              message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {message.text}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Historique</p>
          {initialActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ligne pour l’instant.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {initialActivities.map((a) => (
                <li key={a.id} className="space-y-1 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{formatDateTimeFr(a.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{a.agent_display_name}</span>
                  </div>
                  <p>
                    <span className="text-muted-foreground">
                      {LEAD_GENERATION_ACTIVITY_TYPE_LABELS[a.activity_type as LeadGenerationActivityType] ??
                        a.activity_type}
                    </span>
                    {" — "}
                    {a.activity_label}
                  </p>
                  {a.outcome ? (
                    <p className="text-xs text-muted-foreground">
                      Résultat :{" "}
                      {LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS[a.outcome as LeadGenerationActivityOutcome] ??
                        a.outcome}
                    </p>
                  ) : null}
                  {a.activity_notes ? <p className="whitespace-pre-wrap text-xs">{a.activity_notes}</p> : null}
                  {a.next_action_at ? (
                    <p className="text-xs text-muted-foreground">
                      Relance : {formatDateTimeFr(a.next_action_at)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
