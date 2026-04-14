"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AgentSheetSelector } from "@/features/cee-workflows/components/agent-sheet-selector";
import { ConfirmateurWorkflowQueue } from "@/features/cee-workflows/components/confirmateur-workflow-queue";
import {
  buildConfirmateurQueuePath,
  buildConfirmateurWorkflowPath,
  type ConfirmateurQueueTab,
} from "@/features/cee-workflows/lib/confirmateur-paths";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import type { ConfirmateurQueueBuckets, ConfirmateurQueueItem } from "@/features/cee-workflows/lib/confirmateur-workflow-activity";

function queueItemsForSheet(queue: ConfirmateurQueueBuckets, sheetCode: string | null): ConfirmateurQueueBuckets {
  if (!sheetCode) return queue;
  const filter = (items: ConfirmateurQueueItem[]) => items.filter((item) => item.sheetCode === sheetCode);
  return {
    pending: filter(queue.pending),
    qualified: filter(queue.qualified),
    docsReady: filter(queue.docsReady),
    recent: filter(queue.recent),
  };
}

export function ConfirmateurWorkstation({
  sheets,
  queue,
  activeSheetId,
  initialQueueTab,
}: {
  sheets: AgentAvailableSheet[];
  queue: ConfirmateurQueueBuckets;
  activeSheetId: string | null;
  initialQueueTab?: ConfirmateurQueueTab | null;
}) {
  const router = useRouter();

  const activeSheetCode = sheets.find((sheet) => sheet.id === activeSheetId)?.code ?? null;
  const filteredQueue = useMemo(() => queueItemsForSheet(queue, activeSheetCode), [queue, activeSheetCode]);

  function changeSheet(sheetId: string | null) {
    router.push(buildConfirmateurQueuePath(sheetId));
  }

  function openWorkflow(item: ConfirmateurQueueItem) {
    const sheet = sheets.find((candidate) => candidate.code === item.sheetCode);
    const sheetForUrl = sheet?.id ?? activeSheetId;
    router.push(buildConfirmateurWorkflowPath(item.workflowId, sheetForUrl));
  }

  if (sheets.length === 0) {
    return (
      <>
        <PageHeader title="Poste Confirmateur" description="Station de qualification et de préparation documentaire par fiche CEE." />
        <EmptyState
          title="Aucune fiche autorisée"
          description="Aucune fiche CEE active n’est affectée à votre compte pour la qualification."
          icon={<ShieldCheck className="size-6" />}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poste Confirmateur"
        description="Choisissez un dossier pour ouvrir la page de confirmation (contrôle, qualification, envoi au closer)."
        actions={<Badge variant="secondary">File de traitement</Badge>}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeSheet(null)}
            className={`rounded-lg border px-3 py-2 text-sm ${activeSheetId == null ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
          >
            Toutes mes fiches
          </button>
        </div>
        <AgentSheetSelector sheets={sheets} activeSheetId={activeSheetId} onSelect={changeSheet} />
      </div>

      <ConfirmateurWorkflowQueue
        queue={filteredQueue}
        onOpen={openWorkflow}
        initialQueueTab={initialQueueTab}
      />
    </div>
  );
}
