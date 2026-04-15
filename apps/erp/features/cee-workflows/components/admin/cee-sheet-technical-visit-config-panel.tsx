"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateCeeSheetTechnicalVisitConfig } from "@/features/cee-workflows/actions/admin-cee-sheet-actions";
import {
  ceeSheetVtConfigStatusLabel,
  resolveCeeSheetVtConfigStatus,
} from "@/features/cee-workflows/lib/cee-sheet-vt-config-status";
import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";
import type { TechnicalVisitTemplateOption } from "@/features/technical-visits/templates/registry";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm md:min-h-10 md:py-2",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

function vtStatusBadgeVariant(
  status: ReturnType<typeof resolveCeeSheetVtConfigStatus>,
): "secondary" | "default" | "destructive" {
  switch (status) {
    case "not_required":
      return "secondary";
    case "configured":
      return "default";
    case "incomplete":
      return "destructive";
  }
}

export function CeeSheetTechnicalVisitConfigPanel({
  sheet,
  templateOptions,
}: {
  sheet: AdminCeeSheetListItem | null;
  templateOptions: TechnicalVisitTemplateOption[];
}) {
  const router = useRouter();
  const [requiresVt, setRequiresVt] = useState(false);
  const [templateKey, setTemplateKey] = useState("");
  const [version, setVersion] = useState<number | "">("");
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!sheet) {
      setRequiresVt(false);
      setTemplateKey("");
      setVersion("");
      setFeedback(null);
      return;
    }
    setRequiresVt(sheet.requiresTechnicalVisit);
    setTemplateKey(sheet.technicalVisitTemplateKey?.trim() ?? "");
    setVersion(sheet.technicalVisitTemplateVersion ?? "");
    setFeedback(null);
  }, [sheet]);

  const liveStatus = useMemo(
    () =>
      resolveCeeSheetVtConfigStatus({
        requiresTechnicalVisit: requiresVt,
        technicalVisitTemplateKey: templateKey || null,
        technicalVisitTemplateVersion: version === "" ? null : Number(version),
      }),
    [requiresVt, templateKey, version],
  );

  const versionsForKey = useMemo(() => {
    const opt = templateOptions.find((o) => o.templateKey === templateKey);
    return opt?.versions ?? [];
  }, [templateOptions, templateKey]);

  async function submit() {
    if (!sheet?.id) return;
    setFeedback(null);
    setPending(true);
    try {
      const v =
        version === "" || version === undefined ? null : typeof version === "number" ? version : Number(version);
      const result = await updateCeeSheetTechnicalVisitConfig({
        sheetId: sheet.id,
        requires_technical_visit: requiresVt,
        technical_visit_template_key: requiresVt ? templateKey.trim() || null : null,
        technical_visit_template_version: requiresVt ? v : null,
      });
      if (!result.ok) {
        setFeedback({ text: result.message, ok: false });
        return;
      }
      setFeedback({ text: "Configuration visite technique enregistrée.", ok: true });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!sheet) {
    return (
      <Card className="border-dashed border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Visite technique (formulaire dynamique)</CardTitle>
          <CardDescription>
            Sélectionnez ou créez une fiche CEE pour configurer le template de visite terrain.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">Visite technique (formulaire dynamique)</CardTitle>
          <CardDescription>
            Gabarits issus du registry applicatif — utilisés à la création de VT (workflow ou lead avec{" "}
            <code className="rounded bg-muted px-1">current_workflow_id</code>).
          </CardDescription>
        </div>
        <Badge variant={vtStatusBadgeVariant(liveStatus)} className="shrink-0">
          {ceeSheetVtConfigStatusLabel(liveStatus)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              feedback.ok
                ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200"
                : "border-destructive/50 bg-destructive/10 text-destructive",
            )}
          >
            {feedback.text}
          </p>
        ) : null}

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={requiresVt}
            onChange={(e) => {
              const next = e.target.checked;
              setRequiresVt(next);
              if (!next) {
                setTemplateKey("");
                setVersion("");
              }
            }}
          />
          Visite technique requise pour cette fiche CEE
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="cee-vt-template-key">Template de visite</Label>
          <select
            id="cee-vt-template-key"
            className={selectClassName}
            disabled={!requiresVt}
            value={templateKey}
            onChange={(e) => {
              const k = e.target.value;
              setTemplateKey(k);
              setVersion("");
            }}
          >
            <option value="">— Sélectionner —</option>
            {templateOptions.map((opt) => (
              <option key={opt.templateKey} value={opt.templateKey}>
                {opt.label} ({opt.templateKey})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cee-vt-template-version">Version du template</Label>
          <select
            id="cee-vt-template-version"
            className={selectClassName}
            disabled={!requiresVt || !templateKey}
            value={version === "" ? "" : String(version)}
            onChange={(e) => {
              const raw = e.target.value;
              setVersion(raw === "" ? "" : Number(raw));
            }}
          >
            <option value="">— Sélectionner —</option>
            {versionsForKey.map((v) => (
              <option key={v.version} value={String(v.version)}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer la configuration VT"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
