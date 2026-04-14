"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AgentSheetSelector } from "@/features/cee-workflows/components/agent-sheet-selector";
import { CloserWorkflowQueue } from "@/features/cee-workflows/components/closer-workflow-queue";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import type { CloserQueueBuckets, CloserQueueItem } from "@/features/cee-workflows/lib/closer-workflow-activity";
import { buildCloserQueuePath, type CloserQueueTab } from "@/features/cee-workflows/lib/closer-paths";

function queueItemsForSheet(queue: CloserQueueBuckets, sheetCode: string | null): CloserQueueBuckets {
  if (!sheetCode) return queue;
  const filter = (items: CloserQueueItem[]) => items.filter((item) => item.sheetCode === sheetCode);
  return {
    pending: filter(queue.pending),
    waitingSignature: filter(queue.waitingSignature),
    followUps: filter(queue.followUps),
    signed: filter(queue.signed),
    lost: filter(queue.lost),
  };
}

export function CloserWorkstation({
  sheets,
  queue,
  activeSheetId,
  initialQueueTab,
}: {
  sheets: AgentAvailableSheet[];
  queue: CloserQueueBuckets;
  activeSheetId: string | null;
  initialQueueTab?: CloserQueueTab | null;
}) {
  const router = useRouter();

  const activeSheetCode = sheets.find((sheet) => sheet.id === activeSheetId)?.code ?? null;
  const filteredQueue = useMemo(() => queueItemsForSheet(queue, activeSheetCode), [queue, activeSheetCode]);

  function changeSheet(sheetId: string | null) {
    router.push(buildCloserQueuePath(sheetId));
  }

  function openLead(item: CloserQueueItem) {
    router.push(`/leads/${item.leadId}`);
  }

  if (sheets.length === 0) {
    return (
      <>
        <PageHeader title="Poste Closer" description="Station de conversion commerciale, signature et relances." />
        <EmptyState
          title="Aucune fiche autorisée"
          description="Aucune fiche CEE active n’est affectée à votre compte pour le poste closer."
          icon={<CircleDollarSign className="size-6" />}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poste Closer"
        description="File de dossiers : ouvrez la fiche lead pour relances, documents et signature."
        actions={<Badge variant="secondary">File de closing</Badge>}
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

      <CloserWorkflowQueue queue={filteredQueue} onOpen={openLead} initialQueueTab={initialQueueTab} />
    </div>
  );
}
