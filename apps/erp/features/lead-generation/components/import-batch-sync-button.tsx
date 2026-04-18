"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { syncGoogleMapsApifyImportAction } from "@/features/lead-generation/actions/sync-google-maps-apify-import-action";
import type {
  SyncGoogleMapsApifyImportPhase,
  SyncGoogleMapsApifyImportResult,
} from "@/features/lead-generation/apify/types";

function phaseMessage(phase: SyncGoogleMapsApifyImportPhase): string {
  const m: Record<SyncGoogleMapsApifyImportPhase, string> = {
    running: "Le scraping ou l’intégration est encore en cours. Réessayez dans quelques instants.",
    failed: "La synchronisation a échoué.",
    completed: "Synchronisation terminée.",
    completed_deferred:
      "Dataset récupéré ; en attente de fusion multi-source (synchronisez aussi l’autre source puis le coordinateur).",
    already_completed: "Cet import était déjà à jour.",
    batch_failed: "Cet import est en erreur côté système.",
    ingesting_elsewhere: "Une intégration est déjà en cours pour cet import. Réessayez plus tard.",
    invalid_batch: "Import introuvable ou invalide.",
  };
  return m[phase] ?? `Étape : ${phase}`;
}

function formatSyncLines(d: SyncGoogleMapsApifyImportResult): string {
  const lines: string[] = [phaseMessage(d.phase)];
  const counts =
    d.ingestedCount !== undefined ||
    d.acceptedCount !== undefined ||
    d.duplicateCount !== undefined ||
    d.rejectedCount !== undefined;
  if (counts) {
    lines.push(
      `Fiches : ${d.ingestedCount ?? "—"} intégrées · ${d.acceptedCount ?? "—"} acceptées · ${d.duplicateCount ?? "—"} doublons · ${d.rejectedCount ?? "—"} rejetées`,
    );
  } else if (d.fetchedCount !== undefined) {
    lines.push(`Éléments récupérés : ${d.fetchedCount}`);
  }
  if (d.message?.trim()) lines.push(d.message.trim());
  if (d.error?.trim()) lines.push(`Détail : ${d.error.trim()}`);
  return lines.join("\n");
}

type ImportBatchSyncButtonProps = {
  batchId: string;
  /** Variante compacte pour le tableau (label court). */
  compact?: boolean;
};

export function ImportBatchSyncButton({ batchId, compact }: ImportBatchSyncButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await syncGoogleMapsApifyImportAction({ batchId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(formatSyncLines(res.data));
      if (res.data.phase === "completed" || res.data.phase === "already_completed") {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button type="button" size={compact ? "sm" : "default"} variant="outline" onClick={run} disabled={pending}>
        {compact ? "Synchroniser" : "Synchroniser cet import"}
      </Button>
      {message ? (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-[11px] leading-snug text-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
