"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
import {
  LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS,
  LEAD_GENERATION_ACTIVITY_OUTCOMES,
  LEAD_GENERATION_ACTIVITY_TYPE_LABELS,
  LEAD_GENERATION_ACTIVITY_TYPES,
  type LeadGenerationActivityOutcome,
  type LeadGenerationActivityType,
} from "@/features/lead-generation/domain/assignment-activity";
import type { LeadGenerationAssignmentActivityListItem } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { formatDateTimeFr } from "@/lib/format";

type Props = {
  assignmentId: string | null;
  initialActivities: LeadGenerationAssignmentActivityListItem[];
  /** Libellés légèrement simplifiés pour la vue agent. */
  variant?: "default" | "agent";
  /** Pas de saisie (ex. vue support / autre titulaire d’assignation). */
  readOnly?: boolean;
};

function nextFollowUpIso(activities: LeadGenerationAssignmentActivityListItem[]): string | null {
  const now = Date.now();
  let best: number | null = null;
  for (const a of activities) {
    if (!a.next_action_at) continue;
    const t = new Date(a.next_action_at).getTime();
    if (t < now) continue;
    if (best === null || t < best) best = t;
  }
  return best !== null ? new Date(best).toISOString() : null;
}

export function LeadGenerationCommercialActivitySection({
  assignmentId,
  initialActivities,
  variant = "default",
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<LeadGenerationActivityType>("call");
  const [activityLabel, setActivityLabel] = useState("");
  const [outcome, setOutcome] = useState<string>("__none__");
  const [activityNotes, setActivityNotes] = useState("");
  const [nextActionLocal, setNextActionLocal] = useState("");

  const count = initialActivities.length;
  const latest = initialActivities[0];
  const nextRel = nextFollowUpIso(initialActivities);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!assignmentId) {
      setMessage("Aucune attribution active : impossible d’enregistrer une activité.");
      return;
    }
    if (!activityLabel.trim()) {
      setMessage("Indiquez un libellé.");
      return;
    }

    let nextActionAt: string | null = null;
    if (nextActionLocal.trim()) {
      const d = new Date(nextActionLocal);
      if (Number.isNaN(d.getTime())) {
        setMessage("Date de relance invalide.");
        return;
      }
      nextActionAt = d.toISOString();
    }

    startTransition(async () => {
      const res = await logLeadGenerationAssignmentActivityAction({
        assignmentId,
        activityType,
        activityLabel: activityLabel.trim(),
        activityNotes: activityNotes.trim() || null,
        outcome: outcome === "__none__" ? null : (outcome as LeadGenerationActivityOutcome),
        nextActionAt,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setActivityLabel("");
      setActivityNotes("");
      setOutcome("__none__");
      setNextActionLocal("");
      setMessage("Activité enregistrée.");
      router.refresh();
    });
  }

  return (
    <Card id="suivi-activite" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">Activité commerciale</CardTitle>
        <p className="text-xs text-muted-foreground">
          {variant === "agent"
            ? "Appels, e-mails et relances — votre historique sur cette fiche."
            : "Journal des interactions commerciales sur cette fiche avant conversion en prospect CRM."}
        </p>
        {count > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            <li>{count} activité{count > 1 ? "s" : ""} enregistrée{count > 1 ? "s" : ""}</li>
            {latest ? (
              <li>
                Dernière : {formatDateTimeFr(latest.created_at)} — {LEAD_GENERATION_ACTIVITY_TYPE_LABELS[latest.activity_type as LeadGenerationActivityType] ?? latest.activity_type}
              </li>
            ) : null}
            {nextRel ? <li>Prochaine relance planifiée : {formatDateTimeFr(nextRel)}</li> : null}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Aucune activité enregistrée pour l’instant.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {assignmentId && readOnly ? (
          <p className="rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-3 text-sm text-muted-foreground">
            Saisie désactivée : cette attribution n’est pas celle du compte avec lequel vous naviguez (vue support).
          </p>
        ) : null}
        {assignmentId && !readOnly ? (
          <form className="space-y-4 rounded-md border border-border bg-muted/10 p-4" onSubmit={submit}>
            <p className="text-xs font-medium text-muted-foreground">Nouvelle entrée</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lg-activity-type">Type</Label>
                <Select value={activityType} onValueChange={(v) => setActivityType(v as LeadGenerationActivityType)}>
                  <SelectTrigger id="lg-activity-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_GENERATION_ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LEAD_GENERATION_ACTIVITY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lg-outcome">Résultat (optionnel)</Label>
                <Select
                  value={outcome}
                  onValueChange={(v) => setOutcome(v == null ? "__none__" : v)}
                >
                  <SelectTrigger id="lg-outcome" className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {LEAD_GENERATION_ACTIVITY_OUTCOMES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lg-label">Libellé</Label>
              <Input
                id="lg-label"
                value={activityLabel}
                onChange={(e) => setActivityLabel(e.target.value)}
                placeholder="Ex. Appel découverte — répondeur"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lg-notes">Note (optionnel)</Label>
              <Textarea
                id="lg-notes"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lg-next">Relance prévue (optionnel)</Label>
              <Input
                id="lg-next"
                type="datetime-local"
                value={nextActionLocal}
                onChange={(e) => setNextActionLocal(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              {variant === "agent" ? "Ajouter une activité" : "Enregistrer l’activité"}
            </Button>
          </form>
        ) : !assignmentId ? (
          <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            Aucune attribution active sur cette fiche : le journal est en lecture seule. Distribuez la fiche à un agent
            pour ajouter des activités.
          </p>
        ) : null}

        {message ? (
          <p className={`text-xs ${message.includes("Enregistr") ? "text-muted-foreground" : "text-destructive"}`}>
            {message}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Historique</p>
          {initialActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ligne pour cette fiche stock.</p>
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
                      {LEAD_GENERATION_ACTIVITY_TYPE_LABELS[a.activity_type as LeadGenerationActivityType] ?? a.activity_type}
                    </span>
                    {" — "}
                    {a.activity_label}
                  </p>
                  {a.outcome ? (
                    <p className="text-xs text-muted-foreground">
                      Résultat :{" "}
                      {LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS[a.outcome as LeadGenerationActivityOutcome] ?? a.outcome}
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
