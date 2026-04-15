"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";
import { createCeeSheet, updateCeeSheet } from "@/features/cee-workflows/actions/admin-cee-sheet-actions";

export type AdminCeeSheetFormValue = {
  id?: string;
  code: string;
  name: string;
  category: string;
  sort_order: string;
  is_commercial_active: boolean;
  simulator_key: string;
  presentation_template_key: string;
  agreement_template_key: string;
  workflow_key: string;
  requires_quote: boolean;
  description: string;
  control_points: string;
  internal_notes: string;
};

export const DEFAULT_ADMIN_CEE_SHEET_FORM: AdminCeeSheetFormValue = {
  code: "",
  name: "",
  category: "",
  sort_order: "100",
  is_commercial_active: true,
  simulator_key: "",
  presentation_template_key: "",
  agreement_template_key: "",
  workflow_key: "",
  requires_quote: true,
  description: "",
  control_points: "",
  internal_notes: "",
};

export function formFromSheet(sheet: AdminCeeSheetListItem | null): AdminCeeSheetFormValue {
  if (!sheet) return DEFAULT_ADMIN_CEE_SHEET_FORM;
  return {
    id: sheet.id,
    code: sheet.code,
    name: sheet.name,
    category: sheet.category ?? "",
    sort_order: String(sheet.sortOrder ?? 100),
    is_commercial_active: sheet.isCommercialActive,
    simulator_key: sheet.simulatorKey ?? "",
    presentation_template_key: sheet.presentationTemplateKey ?? "",
    agreement_template_key: sheet.agreementTemplateKey ?? "",
    workflow_key: sheet.workflowKey ?? "",
    requires_quote: sheet.requiresQuote,
    description: sheet.description ?? "",
    control_points: sheet.controlPoints ?? "",
    internal_notes: sheet.internalNotes ?? "",
  };
}

export function CeeSheetForm({
  sheet,
  onSaved,
}: {
  sheet: AdminCeeSheetListItem | null;
  onSaved: (sheetId: string) => void;
}) {
  const [form, setForm] = useState<AdminCeeSheetFormValue>(formFromSheet(sheet));
  const [feedback, setFeedback] = useState<{ text: string; variant: "ok" | "err" } | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setForm(formFromSheet(sheet));
    setFeedback(null);
  }, [sheet]);

  function patch<K extends keyof AdminCeeSheetFormValue>(key: K, value: AdminCeeSheetFormValue[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setFeedback(null);
    setIsPending(true);
    try {
      const action = form.id ? updateCeeSheet : createCeeSheet;
      const result = await action({
        id: form.id,
        code: form.code,
        name: form.name,
        category: form.category || null,
        sort_order: Number(form.sort_order) || 100,
        is_commercial_active: form.is_commercial_active,
        simulator_key: form.simulator_key,
        presentation_template_key: form.presentation_template_key,
        agreement_template_key: form.agreement_template_key,
        workflow_key: form.workflow_key || null,
        requires_quote: form.requires_quote,
        description: form.description || null,
        control_points: form.control_points || null,
        internal_notes: form.internal_notes || null,
      });
      if (!result.ok) {
        setFeedback({ text: result.message, variant: "err" });
        return;
      }
      setFeedback({ text: "Fiche CEE enregistrée.", variant: "ok" });
      onSaved(result.data);
    } finally {
      setIsPending(false);
    }
  }

  const canSubmit =
    Boolean(form.code.trim()) &&
    Boolean(form.name.trim()) &&
    Boolean(form.simulator_key.trim()) &&
    Boolean(form.presentation_template_key.trim()) &&
    Boolean(form.agreement_template_key.trim());

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>{form.id ? "Éditer la fiche" : "Nouvelle fiche CEE"}</CardTitle>
        <CardDescription>
          Configuration métier, simulateur, templates présentation / accord et comportement du workflow. La visite
          technique dynamique se configure dans le panneau dédié sous ce formulaire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback ? (
          <div
            role={feedback.variant === "err" ? "alert" : "status"}
            className={
              feedback.variant === "err"
                ? "rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                : "rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
            }
          >
            {feedback.text}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cee-code">Code *</Label>
            <Input id="cee-code" value={form.code} onChange={(e) => patch("code", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-name">Nom *</Label>
            <Input id="cee-name" value={form.name} onChange={(e) => patch("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-category">Catégorie</Label>
            <Input id="cee-category" value={form.category} onChange={(e) => patch("category", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-sort-order">Ordre</Label>
            <Input id="cee-sort-order" value={form.sort_order} onChange={(e) => patch("sort_order", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-simulator">Simulator key *</Label>
            <Input id="cee-simulator" value={form.simulator_key} onChange={(e) => patch("simulator_key", e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Lier à la ligne métier : <code className="rounded bg-muted px-1">destrat</code> pour déstratificateurs,{" "}
              <code className="rounded bg-muted px-1">pac</code> pour pompes à chaleur (présentation / accord / simulateur).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-workflow-key">Workflow key</Label>
            <Input id="cee-workflow-key" value={form.workflow_key} onChange={(e) => patch("workflow_key", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-presentation-key">Template présentation *</Label>
            <Input id="cee-presentation-key" value={form.presentation_template_key} onChange={(e) => patch("presentation_template_key", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cee-agreement-key">Template accord *</Label>
            <Input id="cee-agreement-key" value={form.agreement_template_key} onChange={(e) => patch("agreement_template_key", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_commercial_active} onChange={(e) => patch("is_commercial_active", e.target.checked)} />
            Fiche commercialement active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.requires_quote} onChange={(e) => patch("requires_quote", e.target.checked)} />
            Devis requis
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cee-description">Description</Label>
          <Textarea id="cee-description" value={form.description} onChange={(e) => patch("description", e.target.value)} className="min-h-20" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cee-control-points">Points de contrôle</Label>
          <Textarea id="cee-control-points" value={form.control_points} onChange={(e) => patch("control_points", e.target.value)} className="min-h-24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cee-internal-notes">Notes internes</Label>
          <Textarea id="cee-internal-notes" value={form.internal_notes} onChange={(e) => patch("internal_notes", e.target.value)} className="min-h-20" />
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={isPending || !canSubmit}>
            {form.id ? "Mettre à jour" : "Créer la fiche"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
