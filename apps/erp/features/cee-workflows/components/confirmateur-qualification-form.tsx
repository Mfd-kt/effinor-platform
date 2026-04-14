"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConfirmateurQualificationInput } from "@/features/cee-workflows/schemas/confirmateur-workspace.schema";

export const DEFAULT_CONFIRMATEUR_QUALIFICATION: ConfirmateurQualificationInput = {
  qualification_status: "a_confirmer",
  dossier_complet: false,
  coherence_simulation: false,
  technical_feasibility: false,
  missing_information: "",
  confirmateur_notes: "",
  closer_handover_notes: "",
  requires_technical_visit_override: null,
  quote_required_override: null,
};

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-md border px-3 py-1 text-sm ${value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
        >
          Oui
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-md border px-3 py-1 text-sm ${!value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
        >
          Non
        </button>
      </div>
    </div>
  );
}

function TriStateRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null | undefined;
  onChange: (next: boolean | null) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(true)} className={`rounded-md border px-3 py-1 text-sm ${value === true ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Oui</button>
        <button type="button" onClick={() => onChange(false)} className={`rounded-md border px-3 py-1 text-sm ${value === false ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Non</button>
        <button type="button" onClick={() => onChange(null)} className={`rounded-md border px-3 py-1 text-sm ${value == null ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Auto</button>
      </div>
    </div>
  );
}

export function ConfirmateurQualificationForm({
  value,
  onChange,
}: {
  value: ConfirmateurQualificationInput;
  onChange: (next: ConfirmateurQualificationInput) => void;
}) {
  function patch<K extends keyof ConfirmateurQualificationInput>(
    key: K,
    nextValue: ConfirmateurQualificationInput[K],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Qualification métier</CardTitle>
        <CardDescription>Contrôlez la cohérence du dossier avant production documentaire et transmission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="qualification-status">Statut de qualification</Label>
          <Input
            id="qualification-status"
            value={value.qualification_status}
            onChange={(e) => patch("qualification_status", e.target.value)}
            placeholder="a_confirmer / qualifie / incomplet"
          />
        </div>

        <div className="grid gap-3">
          <ToggleRow label="Dossier complet" value={value.dossier_complet} onChange={(next) => patch("dossier_complet", next)} />
          <ToggleRow
            label="Cohérence simulation"
            value={value.coherence_simulation}
            onChange={(next) => patch("coherence_simulation", next)}
          />
          <ToggleRow
            label="Faisabilité technique"
            value={value.technical_feasibility}
            onChange={(next) => patch("technical_feasibility", next)}
          />
          <TriStateRow
            label="Forcer visite technique"
            value={value.requires_technical_visit_override}
            onChange={(next) => patch("requires_technical_visit_override", next)}
          />
          <TriStateRow
            label="Forcer devis"
            value={value.quote_required_override}
            onChange={(next) => patch("quote_required_override", next)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="missing-information">Informations manquantes</Label>
          <Textarea
            id="missing-information"
            value={value.missing_information ?? ""}
            onChange={(e) => patch("missing_information", e.target.value)}
            className="min-h-20"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmateur-notes">Notes confirmateur</Label>
          <Textarea
            id="confirmateur-notes"
            value={value.confirmateur_notes ?? ""}
            onChange={(e) => patch("confirmateur_notes", e.target.value)}
            className="min-h-24"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="closer-handover">Notes de transmission closer</Label>
          <Textarea
            id="closer-handover"
            value={value.closer_handover_notes ?? ""}
            onChange={(e) => patch("closer_handover_notes", e.target.value)}
            className="min-h-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
