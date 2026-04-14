"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SaveCloserNotesInput } from "@/features/cee-workflows/schemas/closer-workspace.schema";

export const DEFAULT_CLOSER_FORM: Omit<SaveCloserNotesInput, "workflowId"> = {
  closer_notes: null,
  objection_code: null,
  objection_detail: null,
  last_contact_at: null,
  next_follow_up_at: null,
  call_outcome: null,
  loss_reason: null,
};

export function CloserSalesForm({
  value,
  onChange,
}: {
  value: Omit<SaveCloserNotesInput, "workflowId">;
  onChange: (next: Omit<SaveCloserNotesInput, "workflowId">) => void;
}) {
  function patch<K extends keyof Omit<SaveCloserNotesInput, "workflowId">>(
    key: K,
    nextValue: Omit<SaveCloserNotesInput, "workflowId">[K],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Notes commerciales et relances</CardTitle>
        <CardDescription>Centralisez la stratégie closer, les objections et le plan de relance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="closer-notes">Closer notes</Label>
          <Textarea
            id="closer-notes"
            value={value.closer_notes ?? ""}
            onChange={(e) => patch("closer_notes", e.target.value || null)}
            className="min-h-24"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="objection-code">Objection principale</Label>
            <Input
              id="objection-code"
              value={value.objection_code ?? ""}
              onChange={(e) => patch("objection_code", e.target.value || null)}
              placeholder="prix / délai / confiance / autre"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="call-outcome">Résultat d’appel</Label>
            <Input
              id="call-outcome"
              value={value.call_outcome ?? ""}
              onChange={(e) => patch("call_outcome", e.target.value || null)}
              placeholder="joignable / rappel / signature imminente"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="objection-detail">Détail objection</Label>
          <Textarea
            id="objection-detail"
            value={value.objection_detail ?? ""}
            onChange={(e) => patch("objection_detail", e.target.value || null)}
            className="min-h-20"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="last-contact-at">Dernier contact</Label>
            <Input
              id="last-contact-at"
              type="datetime-local"
              value={value.last_contact_at ?? ""}
              onChange={(e) => patch("last_contact_at", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next-follow-up-at">Prochaine relance</Label>
            <Input
              id="next-follow-up-at"
              type="datetime-local"
              value={value.next_follow_up_at ?? ""}
              onChange={(e) => patch("next_follow_up_at", e.target.value || null)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="loss-reason">Raison de perte</Label>
          <Textarea
            id="loss-reason"
            value={value.loss_reason ?? ""}
            onChange={(e) => patch("loss_reason", e.target.value || null)}
            className="min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );
}
