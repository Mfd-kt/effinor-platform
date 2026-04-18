"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runManualCsvLeadGenerationImportAction } from "@/features/lead-generation/actions/run-manual-csv-lead-generation-import-action";

const EXAMPLE = `company_name,phone,email,city
Ma SARL,01 23 45 67 89,contact@example.com,Lyon`;

/**
 * Import manuel CSV → même pipeline d’ingestion que les autres sources.
 */
export function ManualCsvImportPanel() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [filename, setFilename] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await runManualCsvLeadGenerationImportAction({
        csvText,
        ...(sourceLabel.trim() ? { sourceLabel: sourceLabel.trim() } : {}),
        ...(filename.trim() ? { filename: filename.trim() } : {}),
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const d = res.data;
      if (!d.ok) {
        setMessage(
          [
            d.message,
            d.batchId ? `Batch : ${d.batchId}` : null,
            d.skippedEmptyCompany != null && d.skippedEmptyCompany > 0
              ? `Lignes sans raison sociale ignorées : ${d.skippedEmptyCompany}`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
        );
        router.refresh();
        return;
      }
      setMessage(
        [
          "Import terminé.",
          `Batch : ${d.batchId}`,
          `Importées : ${d.importedCount} · Acceptées : ${d.acceptedCount} · Doublons : ${d.duplicateCount} · Rejetées : ${d.rejectedCount}`,
          d.skippedEmptyCompany > 0
            ? `Lignes sans raison sociale ignorées : ${d.skippedEmptyCompany}`
            : null,
          `Statut : ${d.status}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
      setCsvText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Importer un CSV</h3>
      <p className="text-xs text-muted-foreground">
        Première ligne = en-têtes (ex. <code className="rounded bg-muted px-1">company_name</code>,{" "}
        <code className="rounded bg-muted px-1">phone</code>, <code className="rounded bg-muted px-1">city</code>
        …). Une ligne = une entreprise. Les colonnes optionnelles peuvent être absentes.
      </p>
      <div className="space-y-2">
        <Label htmlFor="csv-paste">Contenu CSV</Label>
        <Textarea
          id="csv-paste"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={EXAMPLE}
          rows={8}
          className="min-h-[140px] font-mono text-xs"
          spellCheck={false}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="csv-source-label">Libellé source (optionnel)</Label>
          <Input
            id="csv-source-label"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="ex. Liste salons 2026"
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="csv-filename">Nom de fichier (optionnel, repère)</Label>
          <Input
            id="csv-filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="ex. export.csv"
            maxLength={260}
          />
        </div>
      </div>
      <Button type="button" onClick={run} disabled={pending || !csvText.trim()}>
        Importer le CSV
      </Button>
      {message ? (
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
