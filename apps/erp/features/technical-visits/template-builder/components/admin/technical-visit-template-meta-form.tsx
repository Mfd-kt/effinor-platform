"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTechnicalVisitTemplateNextDraftVersion,
  updateTechnicalVisitTemplateMeta,
} from "@/features/technical-visits/template-builder/actions/template-builder-actions";
import { cn } from "@/lib/utils";

type CeeSheetOption = { id: string; label: string };

export function TechnicalVisitTemplateMetaForm({
  templateId,
  initialLabel,
  initialDescription,
  initialCeeSheetId,
  initialIsActive,
  ceeSheets,
  canStartNewDraft,
}: {
  templateId: string;
  initialLabel: string;
  initialDescription: string | null;
  initialCeeSheetId: string | null;
  initialIsActive: boolean;
  ceeSheets: CeeSheetOption[];
  canStartNewDraft: boolean;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [ceeSheetId, setCeeSheetId] = useState(initialCeeSheetId ?? "");
  const [isActive, setIsActive] = useState(initialIsActive);
  const [pending, setPending] = useState(false);
  const [draftPending, setDraftPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const r = await updateTechnicalVisitTemplateMeta({
        templateId,
        label,
        description: description.trim() || null,
        cee_sheet_id: ceeSheetId || null,
        is_active: isActive,
      });
      if (!r.ok) {
        setMessage({ text: r.message, ok: false });
        return;
      }
      setMessage({ text: "Métadonnées enregistrées.", ok: true });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function newDraft() {
    setMessage(null);
    setDraftPending(true);
    try {
      const r = await createTechnicalVisitTemplateNextDraftVersion(templateId);
      if (!r.ok || !r.data) {
        setMessage({ text: !r.ok ? r.message : "Erreur.", ok: false });
        return;
      }
      router.push(`/admin/technical-visit-templates/${templateId}/versions/${r.data.versionId}`);
      router.refresh();
    } finally {
      setDraftPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {message.text}
        </p>
      ) : null}
      <form onSubmit={saveMeta} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nom</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description interne</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Fiche CEE (métadonnée)</Label>
          <select
            value={ceeSheetId}
            onChange={(e) => setCeeSheetId(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <option value="">— Aucune —</option>
            {ceeSheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Template active
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer les métadonnées"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canStartNewDraft || draftPending}
            onClick={newDraft}
          >
            {draftPending ? "Création…" : "Modifier le formulaire (brouillon)"}
          </Button>
        </div>
      </form>
    </div>
  );
}
