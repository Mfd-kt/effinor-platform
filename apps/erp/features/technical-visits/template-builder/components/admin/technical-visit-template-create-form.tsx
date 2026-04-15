"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTechnicalVisitTemplate } from "@/features/technical-visits/template-builder/actions/template-builder-actions";
import { cn } from "@/lib/utils";

type CeeSheetOption = { id: string; label: string };

export function TechnicalVisitTemplateCreateForm({ ceeSheets }: { ceeSheets: CeeSheetOption[] }) {
  const router = useRouter();
  const [templateKey, setTemplateKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [ceeSheetId, setCeeSheetId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const result = await createTechnicalVisitTemplate({
        template_key: templateKey,
        label,
        description: description.trim() || null,
        cee_sheet_id: ceeSheetId || null,
      });
      if (!result.ok) {
        setMessage({ text: result.message, ok: false });
        return;
      }
      if (result.data) {
        router.push(`/admin/technical-visit-templates/${result.data.templateId}/versions/${result.data.versionId}`);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-6">
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

      <div className="space-y-2">
        <Label htmlFor="vt-key">Clé technique</Label>
        <Input
          id="vt-key"
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value)}
          placeholder="PAC_VT_001"
          required
          autoComplete="off"
        />
        <p className="text-muted-foreground text-xs">
          Lettres, chiffres, « . », « - », « _ ». Ne doit pas entrer en conflit avec une clé du registry code
          (ex. BAT-TH-142).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vt-label">Nom affiché</Label>
        <Input
          id="vt-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="PAC — visite technique"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vt-desc">Description interne (optionnel)</Label>
        <Input
          id="vt-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes pour les admins"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vt-cee">Fiche CEE associée (optionnel)</Label>
        <select
          id="vt-cee"
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
        <p className="text-muted-foreground text-xs">
          Métadonnée de filtrage ; la liaison effective se fait sur la fiche CEE (template + version).
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer et ouvrir le builder"}
        </Button>
      </div>
    </form>
  );
}
