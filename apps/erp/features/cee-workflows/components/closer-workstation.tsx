"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleDollarSign } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AgentSheetSelector } from "@/features/cee-workflows/components/agent-sheet-selector";
import { CloserWorkflowQueue } from "@/features/cee-workflows/components/closer-workflow-queue";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import type { CloserQueueBuckets, CloserQueueItem } from "@/features/cee-workflows/lib/closer-workflow-activity";
import { buildCloserQueuePath, type CloserQueueTab } from "@/features/cee-workflows/lib/closer-paths";
import { createClient } from "@/lib/supabase/client";

const LEAD_QUERY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  viewerUserId,
}: {
  sheets: AgentAvailableSheet[];
  queue: CloserQueueBuckets;
  activeSheetId: string | null;
  initialQueueTab?: CloserQueueTab | null;
  viewerUserId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledLeadQueryRef = useRef<string | null>(null);
  const closerRefreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSheetCode = sheets.find((sheet) => sheet.id === activeSheetId)?.code ?? null;
  const filteredQueue = useMemo(() => queueItemsForSheet(queue, activeSheetCode), [queue, activeSheetCode]);

  useEffect(() => {
    const raw = searchParams.get("lead")?.trim() ?? "";
    if (!raw || !LEAD_QUERY_UUID_RE.test(raw)) {
      handledLeadQueryRef.current = null;
      return;
    }
    if (handledLeadQueryRef.current === raw) {
      return;
    }
    handledLeadQueryRef.current = raw;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    const q = params.toString();
    const nextUrl = q ? `${pathname}?${q}` : pathname;
    router.replace(nextUrl, { scroll: false });
    router.push(`/leads/${raw}`);
  }, [searchParams, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    const channelRef: {
      current: ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null;
    } = { current: null };

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;

      channelRef.current = supabase
        .channel(`closer-workstation-wf-${viewerUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "lead_sheet_workflows",
            filter: `assigned_closer_user_id=eq.${viewerUserId}`,
          },
          () => {
            if (closerRefreshDebounceRef.current) {
              clearTimeout(closerRefreshDebounceRef.current);
            }
            closerRefreshDebounceRef.current = setTimeout(() => {
              closerRefreshDebounceRef.current = null;
              router.refresh();
            }, 400);
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (closerRefreshDebounceRef.current) {
        clearTimeout(closerRefreshDebounceRef.current);
        closerRefreshDebounceRef.current = null;
      }
      void createClient().then((supabase) => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      });
    };
  }, [viewerUserId, router]);

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
